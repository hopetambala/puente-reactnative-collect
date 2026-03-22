/**
 * GlassView and GlassContainer Examples
 *
 * This file demonstrates how to use the cross-platform glass effect components
 * in your app with proper fallbacks for Android and older iOS versions.
 */

import { GlassContainer, GlassView } from "@impacto-design-system/Base";
import React, { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

// Example 1: Simple Glass Overlay
export function SimpleGlassExample() {
  return (
    <View style={styles.container}>
      <Image
        style={styles.background}
        source={{
          uri: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop",
        }}
      />

      {/* Glass overlay with text */}
      <GlassView
        style={styles.glassOverlay}
        glassEffectStyle="regular"
        tintColor="rgba(0, 0, 0, 0.1)"
      >
        <Text style={styles.text}>Glass Effect Overlay</Text>
      </GlassView>
    </View>
  );
}

// Example 2: Multiple Glass Cards
export function GlassCardsExample() {
  return (
    <View style={styles.container}>
      <GlassContainer spacing={12} style={styles.cardGrid}>
        <GlassView style={styles.card} glassEffectStyle="clear" isInteractive>
          <Text style={styles.cardTitle}>Card 1</Text>
        </GlassView>

        <GlassView style={styles.card} glassEffectStyle="regular">
          <Text style={styles.cardTitle}>Card 2</Text>
        </GlassView>

        <GlassView style={styles.card} glassEffectStyle="clear">
          <Text style={styles.cardTitle}>Card 3</Text>
        </GlassView>
      </GlassContainer>
    </View>
  );
}

// Example 3: Animated Glass Effect (hide/show)
export function AnimatedGlassExample() {
  const [visible, setVisible] = useState(true);

  return (
    <View style={styles.container}>
      <Image
        style={styles.background}
        source={{
          uri: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop",
        }}
      />

      <GlassView
        style={styles.glassOverlay}
        glassEffectStyle={{
          style: visible ? "regular" : "none",
          animate: true,
          animationDuration: 0.5,
        }}
      >
        <Text style={styles.text}>Toggle Glass Effect</Text>
      </GlassView>

      <Pressable style={styles.button} onPress={() => setVisible(!visible)}>
        <Text style={styles.buttonText}>
          {visible ? "Hide" : "Show"} Glass
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    ...StyleSheet.absoluteFillObject,
    height: "100%",
    width: "100%",
  },
  button: {
    alignSelf: "center",
    backgroundColor: "#007AFF",
    borderRadius: 8,
    bottom: 40,
    paddingHorizontal: 24,
    paddingVertical: 12,
    position: "absolute",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  card: {
    alignItems: "center",
    borderRadius: 8,
    flex: 1,
    height: 80,
    justifyContent: "center",
  },
  cardGrid: {
    flexDirection: "row",
    padding: 16,
  },
  cardTitle: {
    color: "#000",
    fontSize: 14,
    fontWeight: "600",
  },
  container: {
    backgroundColor: "#f5f5f5",
    flex: 1,
  },
  glassOverlay: {
    alignItems: "center",
    borderRadius: 12,
    height: 120,
    justifyContent: "center",
    left: 50,
    padding: 16,
    position: "absolute",
    right: 50,
    top: 100,
  },
  text: {
    color: "#000",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
