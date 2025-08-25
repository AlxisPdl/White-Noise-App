import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import Slider from "@react-native-community/slider";
import { Audio } from "expo-av";

export default function Index() {
  const soundsList = [
    { name: "Rain", file: require('../../assets/rain.mp3'), color: "#1abc9c" },
    { name: "Car", file: require('../../assets/car.mp3'), color: "#e67e22" },
  ];

  const [volumes, setVolumes] = useState(soundsList.map(() => 0.5));
  const [mutes, setMutes] = useState(soundsList.map(() => false));
  const [masterMute, setMasterMute] = useState(false);
  const [masterVolume, setMasterVolume] = useState(1);

  const soundsRef = useRef([]);

  // Setup audio mode pour background et silent mode
  useEffect(() => {
    async function setupAudio() {
      await Audio.setAudioModeAsync({
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        allowsRecordingIOS: false,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
      });
    }
    setupAudio();
  }, []);

  // Charger et jouer les sons
  useEffect(() => {
    let isMounted = true;

    async function loadAllSounds() {
      try {
        const loadedSounds = [];
        for (let i = 0; i < soundsList.length; i++) {
          const { sound } = await Audio.Sound.createAsync(
            soundsList[i].file,
            { isLooping: true, volume: volumes[i] * masterVolume }
          );
          await sound.playAsync();
          loadedSounds.push(sound);
        }
        if (isMounted) soundsRef.current = loadedSounds;
      } catch (error) {
        console.log("❌ Erreur audio :", error);
      }
    }

    loadAllSounds();

    return () => {
      isMounted = false;
      soundsRef.current.forEach(s => s.unloadAsync());
    };
  }, []);

  // Modification du volume individuel
  const handleVolumeChange = (index, value) => {
    setVolumes(prev => {
      const newVolumes = [...prev];
      newVolumes[index] = value;
      return newVolumes;
    });
    const sound = soundsRef.current[index];
    if (sound && !mutes[index] && !masterMute) {
      sound.setVolumeAsync(value * masterVolume);
    }
  };

  // Toggle mute individuel
  const toggleMute = (index) => {
    setMutes(prev => {
      const newMutes = [...prev];
      newMutes[index] = !newMutes[index];
      const sound = soundsRef.current[index];
      if (sound) sound.setVolumeAsync(newMutes[index] || masterMute ? 0 : volumes[index] * masterVolume);
      return newMutes;
    });
  };

  // Toggle Master Mute
  const toggleMasterMute = () => {
    const newMasterMute = !masterMute;
    setMasterMute(newMasterMute);
    soundsRef.current.forEach((sound, i) => {
      sound.setVolumeAsync(newMasterMute || mutes[i] ? 0 : volumes[i] * masterVolume);
    });
  };

  // Modification du Master Volume
  const handleMasterVolume = (value) => {
    setMasterVolume(value);
    soundsRef.current.forEach((sound, i) => {
      if (!mutes[i] && !masterMute) {
        sound.setVolumeAsync(volumes[i] * value);
      }
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>White Noise Mixer</Text>

      {/* Master Controls */}
      <View style={styles.masterWrapper}>
        <Text style={styles.masterLabel}>Master</Text>
        <Slider
          style={styles.masterSlider}
          minimumValue={0}
          maximumValue={1}
          value={masterVolume}
          minimumTrackTintColor="#ffffff"
          maximumTrackTintColor="#555"
          thumbTintColor="#ffffff"
          onValueChange={handleMasterVolume}
        />
        <TouchableOpacity style={[styles.muteButton, masterMute && styles.muted]} onPress={toggleMasterMute}>
          <Text style={styles.muteText}>{masterMute ? "Unmute" : "Mute"}</Text>
        </TouchableOpacity>
      </View>

      {/* Individual Tracks */}
      {soundsList.map((soundItem, index) => (
        <View key={index} style={[styles.sliderWrapper, { borderColor: soundItem.color }]}>
          <View style={styles.sliderRow}>
            <Text style={styles.sliderLabel}>{soundItem.name}</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              value={volumes[index]}
              minimumTrackTintColor={soundItem.color}
              maximumTrackTintColor="#333"
              thumbTintColor={soundItem.color}
              onValueChange={(val) => handleVolumeChange(index, val)}
            />
            <TouchableOpacity
              style={[styles.muteButton, mutes[index] && styles.muted]}
              onPress={() => toggleMute(index)}
            >
              <Text style={styles.muteText}>{mutes[index] ? "Unmute" : "Mute"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a1f44" },
  content: { paddingVertical: 40, paddingHorizontal: 20 },
  title: { fontSize: 26, color: "white", marginBottom: 20, textAlign: "center", fontWeight: "bold" },
  masterWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
    padding: 15,
    borderRadius: 12,
    backgroundColor: "#222",
  },
  masterLabel: { color: "white", fontWeight: "bold", marginRight: 10, width: 60 },
  masterSlider: { flex: 1, height: 40 },
  sliderWrapper: { marginBottom: 20, padding: 15, borderRadius: 12, borderWidth: 2 },
  sliderRow: { flexDirection: "row", alignItems: "center" },
  sliderLabel: { color: "white", fontWeight: "bold", width: 60, marginRight: 10 },
  slider: { flex: 1, height: 40 },
  muteButton: { marginLeft: 10, paddingVertical: 5, paddingHorizontal: 10, backgroundColor: "#444", borderRadius: 5 },
  muted: { backgroundColor: "#ff0000" },
  muteText: { color: "white" },
});
