package expo.modules.notifications.notifications.presentation.builders

import android.app.Notification
import android.content.Context
import android.graphics.Bitmap
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.os.SystemClock
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.bumptech.glide.Glide
import com.google.firebase.messaging.RemoteMessage
import expo.modules.notifications.notifications.model.Notification as ExpoNotification
import expo.modules.notifications.notifications.model.NotificationRequest
import expo.modules.notifications.notifications.model.RemoteNotificationContent
import expo.modules.notifications.service.delegates.SharedPreferencesNotificationCategoriesStore
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.cancelAndJoin
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withContext
import kotlinx.coroutines.withTimeout
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNotSame
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import java.io.ByteArrayOutputStream
import java.io.Closeable
import java.net.InetAddress
import java.net.ServerSocket
import java.net.Socket
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.CountDownLatch
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicInteger

/**
 * Instrumentation against the installed, source-linked expo-notifications
 * module. No mocked Bitmap, Glide loader, or downloadImage implementation.
 * The runner attaches these test sources to that module's androidTest source
 * set. The module test APK owns its own context, cache, and notification channel;
 * it does not launch or clear the Collect app or touch its offline queue.
 */
@RunWith(AndroidJUnit4::class)
class DownloadImageNativeTest {
  private lateinit var context: Context
  private lateinit var server: ImageFixtureServer
  private var isolatedContextVerified = false
  private val ownedBitmaps = mutableListOf<Bitmap>()

  @Before
  fun setUp() {
    context = InstrumentationRegistry.getInstrumentation().targetContext
    assertFalse("Instrumentation must not use the Android Collect app", context.packageName == "puente.collect")
    assertFalse("Instrumentation must not use the Collect bundle identifier", context.packageName == "io.ionic.starter1270348")
    assertEquals("Instrumentation must use the isolated notification module test APK", "expo.modules.notifications.test", context.packageName)
    isolatedContextVerified = true
    InstrumentationRegistry.getInstrumentation().runOnMainSync {
      Glide.get(context).clearMemory()
    }
    server = ImageFixtureServer(realLargePng())
  }

  @After
  fun tearDown() {
    // JUnit also calls @After when the context guard fails in @Before.
    if (!isolatedContextVerified) return
    if (::server.isInitialized) server.close()
    ownedBitmaps.forEach { if (!it.isRecycled) it.recycle() }
    InstrumentationRegistry.getInstrumentation().runOnMainSync {
      Glide.get(context).clearMemory()
    }
  }

  @Test
  fun largeRemoteImageIsBoundedTo512Pixels(): Unit = runBlocking {
    val image = requireImage(downloadImage(context, server.uri("large.png")))

    assertTrue("width must be in 1..512, was ${image.width}", image.width in 1..512)
    assertTrue("height must be in 1..512, was ${image.height}", image.height in 1..512)
    assertEquals("fitCenter must preserve the 2048:1536 aspect ratio", 4.0 / 3.0, image.width.toDouble() / image.height, 0.01)
    assertEquals(Color.rgb(36, 91, 143), image.getPixel(image.width / 2, image.height / 2))
    assertEquals(1, server.requestCount("large.png"))
  }

  @Test
  fun notificationOwnsACopyAfterGlideRequestCleanup(): Unit = runBlocking {
    val uri = server.uri("ownership.png")
    val image = requireImage(downloadImage(context, uri))
    val manager = Glide.with(context.applicationContext)
    val cacheTarget = manager.asBitmap().load(uri).fitCenter()
      .disallowHardwareConfig().onlyRetrieveFromCache(true).submit(512, 512)
    val cached = withContext(Dispatchers.IO) { cacheTarget.get(5, TimeUnit.SECONDS) }
    try {
      assertNotSame("the caller must not own Glide's cached resource", cached, image)
    } finally {
      manager.clear(cacheTarget)
    }
    InstrumentationRegistry.getInstrumentation().runOnMainSync {
      Glide.get(context).clearMemory()
    }

    assertFalse("the returned copy must survive request/cache cleanup", image.isRecycled)
    assertEquals(Color.rgb(36, 91, 143), image.getPixel(image.width / 2, image.height / 2))
  }

  @Test
  fun repeatedImageUsesGlideCacheWithoutAnotherNetworkRequest(): Unit = runBlocking {
    val uri = server.uri("cache.png")
    val first = requireImage(downloadImage(context, uri))
    assertEquals(1, server.requestCount("cache.png"))
    // Make network reuse impossible. A second success must come from Glide.
    server.close()
    val second = requireImage(downloadImage(context, uri, 500, 500))

    assertEquals(1, server.requestCount("cache.png"))
    assertNotSame(first, second)
    assertEquals(first.width, second.width)
    assertEquals(first.height, second.height)
    assertEquals(first.getPixel(0, 0), second.getPixel(0, 0))
  }

  @Test
  fun invalidAndUnavailableImagesReturnNull(): Unit = runBlocking {
    assertNull(downloadImage(context, server.uri("invalid.png"), 500, 500))
    assertNull(downloadImage(context, server.uri("missing.png"), 500, 500))
    val unavailable = server.uri("unavailable.png")
    server.close()
    assertNull(downloadImage(context, unavailable, 500, 500))
  }

  @Test
  fun stalledImageCooperativelyCancelsAndNextRequestWorks(): Unit = runBlocking {
    val pending = async(Dispatchers.IO) {
      downloadImage(context, server.uri("stall.png"), 8000, 8000)
    }
    val started = withContext(Dispatchers.IO) { server.stalledRequestStarted.await(5, TimeUnit.SECONDS) }
    assertTrue("fixture must have received the request before cancellation", started)
    val cancelledAt = SystemClock.elapsedRealtime()
    withTimeout(2000) { pending.cancelAndJoin() }

    assertTrue("caller cancellation must propagate", pending.isCancelled)
    assertTrue("cancellation must not wait for the 16-second image timeout", SystemClock.elapsedRealtime() - cancelledAt < 2000)
    server.releaseStalledRequest.countDown()
    requireImage(downloadImage(context, server.uri("after-cancel.png")))
  }

  @Test
  fun notificationBuilderStillBuildsUsableNotificationWhenImageFails(): Unit = runBlocking {
    val payload = Bundle().apply {
      putString("gcm.n.e", "1")
      putString("gcm.n.title", "Native image verification")
      putString("gcm.n.body", "Body survives failed remote image")
      putString("gcm.n.image", server.uri("missing.png").toString())
    }
    val content = RemoteNotificationContent(RemoteMessage(payload))
    assertTrue("test must take the real remote-image notification branch", content.containsImage())
    val request = NotificationRequest("native-image-${UUID.randomUUID()}", content, null)
    val builder = object : ExpoNotificationBuilder(
      context, ExpoNotification(request), SharedPreferencesNotificationCategoriesStore(context)
    ) {
      override val icon: Int get() = android.R.drawable.ic_dialog_info
    }
    val built = builder.build()

    assertEquals("Native image verification", built.extras.getCharSequence(Notification.EXTRA_TITLE).toString())
    assertEquals("Body survives failed remote image", built.extras.getCharSequence(Notification.EXTRA_TEXT).toString())
    assertNotNull("a usable notification retains its default response action", built.contentIntent)
    assertNotNull("request metadata survives the failed image", built.extras.getByteArray(ExpoNotificationBuilder.EXTRAS_MARSHALLED_NOTIFICATION_REQUEST_KEY))
    assertNull(built.getLargeIcon())
    assertEquals(1, server.requestCount("missing.png"))
  }

  private fun requireImage(image: Bitmap?): Bitmap {
    assertNotNull("the real image pipeline must return a decoded bitmap", image)
    return requireNotNull(image).also { ownedBitmaps.add(it) }
  }

  private fun realLargePng(): ByteArray {
    val source = Bitmap.createBitmap(2048, 1536, Bitmap.Config.ARGB_8888)
    return try {
      source.eraseColor(Color.rgb(36, 91, 143))
      ByteArrayOutputStream().use { bytes ->
        assertTrue(source.compress(Bitmap.CompressFormat.PNG, 100, bytes))
        bytes.toByteArray()
      }
    } finally {
      source.recycle()
    }
  }
}

/** Loopback HTTP fixture serving actual encoded pixels, malformed data and failures. */
private class ImageFixtureServer(private val png: ByteArray) : Closeable {
  private val socket = ServerSocket(0, 16, InetAddress.getByName("127.0.0.1"))
  private val port = socket.localPort
  private val namespace = UUID.randomUUID().toString()
  private val executor = Executors.newCachedThreadPool()
  private val requests = ConcurrentHashMap<String, AtomicInteger>()
  val stalledRequestStarted = CountDownLatch(1)
  val releaseStalledRequest = CountDownLatch(1)

  init {
    executor.execute {
      while (!socket.isClosed) {
        val client = try { socket.accept() } catch (_: java.io.IOException) { break }
        executor.execute { serve(client) }
      }
    }
  }

  fun uri(path: String): Uri = Uri.parse("http://127.0.0.1:$port/$namespace/$path")

  fun requestCount(path: String): Int = requests[path]?.get() ?: 0

  private fun serve(client: Socket) {
    client.use {
      it.soTimeout = 5000
      val input = it.getInputStream().bufferedReader(Charsets.US_ASCII)
      val request = input.readLine() ?: return
      val path = request.split(" ").getOrNull(1)?.substringAfterLast('/') ?: return
      while (!input.readLine().isNullOrEmpty()) { /* consume HTTP headers */ }
      requests.computeIfAbsent(path) { AtomicInteger() }.incrementAndGet()
      if (path == "stall.png") {
        stalledRequestStarted.countDown()
        releaseStalledRequest.await(20, TimeUnit.SECONDS)
        return
      }
      val missing = path == "missing.png"
      val body = when {
        missing -> byteArrayOf()
        path == "invalid.png" -> "This is not image data".toByteArray()
        else -> png
      }
      val status = if (missing) "404 Not Found" else "200 OK"
      val headers = "HTTP/1.1 $status\r\nContent-Type: image/png\r\nContent-Length: ${body.size}\r\nConnection: close\r\n\r\n"
      it.getOutputStream().apply {
        write(headers.toByteArray(Charsets.US_ASCII))
        write(body)
        flush()
      }
    }
  }

  override fun close() {
    releaseStalledRequest.countDown()
    socket.close()
    executor.shutdown()
    assertTrue("loopback fixture threads must terminate", executor.awaitTermination(5, TimeUnit.SECONDS))
  }
}
