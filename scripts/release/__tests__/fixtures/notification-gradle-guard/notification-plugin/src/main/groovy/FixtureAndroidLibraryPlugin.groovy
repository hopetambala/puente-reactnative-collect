import org.gradle.api.Plugin
import org.gradle.api.Project

// Only the DSL surface touched by the init script. This plugin has no Android
// dependency, SDK, device access, network repository, or instrumentation work.
class FixtureAndroidLibraryPlugin implements Plugin<Project> {
  void apply(Project project) {
    project.configurations.create('androidTestImplementation')
    project.extensions.add('androidComponents', new FixtureAndroidComponents())
  }
}

class FixtureAndroidComponents {
  void finalizeDsl(Closure configure) {
    configure(new Expando(
      defaultConfig: new Expando(),
      sourceSets: new Expando(androidTest: new Expando(
        java: new FixtureJavaSources(),
        manifest: new FixtureManifest()
      ))
    ))
  }
}

class FixtureJavaSources {
  void setSrcDirs(List sources) {}
}

class FixtureManifest {
  void srcFile(File manifest) {}
}
