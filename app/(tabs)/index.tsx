import React, { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import Slider from "@react-native-community/slider";
import { Audio } from "expo-av"; // la lib correcte

const sounds = [
  { name: "Boiling Water", file: require("../../assets/boiling-water.mp3") },
  { name: "Car", file: require("../../assets/car.mp3") },
  { name: "Clock", file: require("../../assets/clock.mp3") },
  { name: "Coffee Machine", file: require("../../assets/coffee-machine.mp3") },
  { name: "Fire 1", file: require("../../assets/fire-1.mp3") },
  { name: "Fire 2", file: require("../../assets/fire-2.mp3") },
  { name: "Fire", file: require("../../assets/fire.mp3") },
  { name: "Lake 1", file: require("../../assets/lake-1.mp3") },
  { name: "Lake", file: require("../../assets/lake.mp3") },
  { name: "Ocean", file: require("../../assets/ocean.mp3") },
  { name: "Rain 01", file: require("../../assets/rain-01.mp3") },
  { name: "Rain 02", file: require("../../assets/rain-02.mp3") },
  { name: "Rain 04", file: require("../../assets/rain-04.mp3") },
  { name: "River 1", file: require("../../assets/river-1.mp3") },
  { name: "Shower 1", file: require("../../assets/shower-1.mp3") },
  { name: "Spring Weather 1", file: require("../../assets/spring-weather-1.mp3") },
  { name: "Water Dripping", file: require("../../assets/water-dripping-1.mp3") },
  { name: "Wind 1", file: require("../../assets/wind-1.mp3") },
  { name: "Wind Chime 2", file: require("../../assets/wind-chime-2.mp3") },
  { name: "Wind Gust 01", file: require("../../assets/wind-gust-01.mp3") },
  { name: "Wind Howl 01", file: require("../../assets/wind-howl-01.mp3") },
  { name: "Windy Forest Ambience 01", file: require("../../assets/windy-forest-ambience-01.mp3") },
];


export default function SoundBoard() {
  const [playingSounds, setPlayingSounds] = useState<{ [key: string]: Audio.Sound }>({});
  const [volumes, setVolumes] = useState<{ [key: string]: number }>({});

  const playSound = async (item: any) => {
    try {
      if (playingSounds[item.name]) {
        await playingSounds[item.name].stopAsync();
        await playingSounds[item.name].unloadAsync();
        const updated = { ...playingSounds };
        delete updated[item.name];
        setPlayingSounds(updated);
      } else {
        const { sound } = await Audio.Sound.createAsync(item.file, {
          isLooping: true,
          volume: volumes[item.name] ?? 1.0,
        });
        await sound.playAsync();
        setPlayingSounds({ ...playingSounds, [item.name]: sound });
      }
    } catch (e) {
      console.log("Erreur son :", e);
    }
  };

  const setVolume = async (name: string, value: number) => {
    setVolumes({ ...volumes, [name]: value });
    if (playingSounds[name]) {
      await playingSounds[name].setVolumeAsync(value);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎶 Relaxation Player</Text>
      <FlatList
        data={sounds}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <TouchableOpacity
              style={[
                styles.button,
                playingSounds[item.name] ? styles.buttonActive : null,
              ]}
              onPress={() => playSound(item)}
            >
              <Text style={styles.buttonText}>
                {playingSounds[item.name] ? "⏸️ Stop" : "▶️ Play"} {item.name}
              </Text>
            </TouchableOpacity>

            <Slider
              style={{ width: "80%" }}
              minimumValue={0}
              maximumValue={1}
              step={0.01}
              value={volumes[item.name] ?? 1.0}
              onValueChange={(value) => setVolume(item.name, value)}
              minimumTrackTintColor="#8a2be2"
              maximumTrackTintColor="#ccc"
              thumbTintColor="#8a2be2"
            />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a1a", padding: 20, paddingTop: 50 },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff", marginBottom: 20, textAlign: "center" },
  card: { backgroundColor: "#2a2a2a", padding: 15, marginBottom: 15, borderRadius: 12, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
  button: { backgroundColor: "#444", padding: 10, borderRadius: 8, marginBottom: 10, width: "80%", alignItems: "center" },
  buttonActive: { backgroundColor: "#8a2be2" },
  buttonText: { color: "#fff", fontSize: 16 },
});
