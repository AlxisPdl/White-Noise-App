import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Modal } from "react-native";
import Slider from "@react-native-community/slider";
import { Audio } from "expo-av";

interface SoundItem {
  name: string;
  file: any;
}

interface VolumeSliderProps {
  soundName: string;
  initialVolume: number;
  onVolumeChange: (name: string, volume: number) => void;
}

interface PlayingSoundsState {
  [key: string]: Audio.Sound;
}

interface VolumesState {
  [key: string]: number;
}

interface LoadingSoundsState {
  [key: string]: boolean;
}

interface PreloadedSoundsState {
  [key: string]: Audio.Sound;
}

type ActiveTab = 'ambient' | 'whitenoise';

const ambientSounds: SoundItem[] = [
  { name: "Boiling Water", file: require("../../assets/ambiant/boiling-water.mp3") },
  { name: "Car", file: require("../../assets/ambiant/car.mp3") },
  { name: "Clock", file: require("../../assets/ambiant/clock.mp3") },
  { name: "Coffee Machine", file: require("../../assets/ambiant/coffee-machine.mp3") },
  { name: "Fire 1", file: require("../../assets/ambiant/fire-1.mp3") },
  { name: "Fire 2", file: require("../../assets/ambiant/fire-2.mp3") },
  { name: "Fire", file: require("../../assets/ambiant/fire.mp3") },
  { name: "Lake 1", file: require("../../assets/ambiant/lake-1.mp3") },
  { name: "Lake", file: require("../../assets/ambiant/lake.mp3") },
  { name: "Ocean", file: require("../../assets/ambiant/ocean.mp3") },
  { name: "Rain 01", file: require("../../assets/ambiant/rain-01.mp3") },
  { name: "Rain 02", file: require("../../assets/ambiant/rain-02.mp3") },
  { name: "Rain 04", file: require("../../assets/ambiant/rain-04.mp3") },
  { name: "River 1", file: require("../../assets/ambiant/river-1.mp3") },
  { name: "Shower 1", file: require("../../assets/ambiant/shower-1.mp3") },
  { name: "Spring Weather 1", file: require("../../assets/ambiant/spring-weather-1.mp3") },
  { name: "Water Dripping 1", file: require("../../assets/ambiant/water-dripping-1.mp3") },
  { name: "Wind 1", file: require("../../assets/ambiant/wind-1.mp3") },
  { name: "Wind Chime 2", file: require("../../assets/ambiant/wind-chime-2.mp3") },
  { name: "Wind Gust 01", file: require("../../assets/ambiant/wind-gust-01.mp3") },
  { name: "Wind Howl 01", file: require("../../assets/ambiant/wind-howl-01.mp3") },
  { name: "Windy Forest Ambience 01", file: require("../../assets/ambiant/windy-forest-ambience-01.mp3") },
];

const whiteNoiseSounds: SoundItem[] = [
  { name: "Blue Noise", file: require("../../assets/white/blue-noise.mp3") },
  { name: "Brown Noise", file: require("../../assets/white/brown-noise.mp3") },
  { name: "Grey Noise", file: require("../../assets/white/grey-noise.mp3") },
  { name: "Rainy Day Bird", file: require("../../assets/white/rainy-day-bird.mp3") },
  { name: "Soft Brown Noise", file: require("../../assets/white/soft-brown-noise.mp3") },
  { name: "Softdeep White Noise", file: require("../../assets/white/softdeep-white-noise.mp3") },
  { name: "Underwater White Noise", file: require("../../assets/white/underwater-white-noise.mp3") },
  { name: "Violet Noise", file: require("../../assets/white/violet-noise.mp3") },
  { name: "Wall Air Conditioner", file: require("../../assets/white/wall-air-conditioner.mp3") },
  { name: "White Noise 1", file: require("../../assets/white/white-noise-1.mp3") },
  { name: "White Noise 2", file: require("../../assets/white/white-noise-2.mp3") },
];

const VolumeSlider: React.FC<VolumeSliderProps> = ({ soundName, initialVolume, onVolumeChange }) => {
  const [localVolume, setLocalVolume] = useState<number>(initialVolume);

  const handleSliderChange = (value: number): void => {
    setLocalVolume(value);
  };

  const handleSliderComplete = (value: number): void => {
    onVolumeChange(soundName, value);
  };

  return (
    <View style={styles.sliderContainer}>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={1}
        step={0.1}
        value={localVolume}
        onValueChange={handleSliderChange}
        onSlidingComplete={handleSliderComplete}
        minimumTrackTintColor="rgba(255, 255, 255, 0.9)"
        maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
        thumbTintColor="#ffffff"
      />
    </View>
  );
};

export default function SoundBoard(): React.JSX.Element {
  const [playingSounds, setPlayingSounds] = useState<PlayingSoundsState>({});
  const [volumes, setVolumes] = useState<VolumesState>({});
  const [preloadedSounds, setPreloadedSounds] = useState<PreloadedSoundsState>({});
  const [loadingSounds, setLoadingSounds] = useState<LoadingSoundsState>({});
  const [isPreloading, setIsPreloading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('ambient');
  const [showStopModal, setShowStopModal] = useState<boolean>(false);

  useEffect(() => {
    const preloadPopularSounds = async (): Promise<void> => {
      const popularSounds: string[] = ["Ocean", "Rain 01", "Fire", "White Noise 1"];
      const preloaded: PreloadedSoundsState = {};
      
      try {
        for (const soundName of popularSounds) {
          const soundItem = [...ambientSounds, ...whiteNoiseSounds].find(s => s.name === soundName);
          if (soundItem) {
            const { sound } = await Audio.Sound.createAsync(soundItem.file, {
              shouldPlay: false,
              isLooping: true,
            });
            preloaded[soundName] = sound;
          }
        }
        setPreloadedSounds(preloaded);
      } catch (error) {
        console.log("Erreur lors du pré-chargement :", error);
      } finally {
        setIsPreloading(false);
      }
    };

    preloadPopularSounds();
  }, []);

  useEffect(() => {
    return () => {
      Object.values(playingSounds).forEach(async (sound: Audio.Sound) => {
        try {
          await sound.stopAsync();
          await sound.unloadAsync();
        } catch (e) {
          console.log("Erreur lors du nettoyage :", e);
        }
      });

      Object.entries(preloadedSounds).forEach(([name, sound]: [string, Audio.Sound]) => {
        if (!playingSounds[name]) {
          try {
            sound.unloadAsync();
          } catch (e) {
            console.log("Erreur lors du nettoyage des sons pré-chargés :", e);
          }
        }
      });
    };
  }, [playingSounds, preloadedSounds]);

  const showError = (message: string): void => {
    Alert.alert("Erreur Audio", message, [{ text: "OK", style: "default" }]);
  };

  const playSound = async (item: SoundItem): Promise<void> => {
    try {
      if (loadingSounds[item.name]) return;

      if (playingSounds[item.name]) {
        await playingSounds[item.name].stopAsync();
        await playingSounds[item.name].unloadAsync();
        const updated = { ...playingSounds };
        delete updated[item.name];
        setPlayingSounds(updated);
      } else {
        setLoadingSounds({ ...loadingSounds, [item.name]: true });

        let sound: Audio.Sound;

        if (preloadedSounds[item.name]) {
          sound = preloadedSounds[item.name];
          await sound.setVolumeAsync(volumes[item.name] ?? 1.0);
          await sound.setIsLoopingAsync(true);
          await sound.playAsync();
        } else {
          const { sound: newSound } = await Audio.Sound.createAsync(item.file, {
            isLooping: true,
            volume: volumes[item.name] ?? 1.0,
          });
          sound = newSound;
          await sound.playAsync();
        }

        setPlayingSounds({ ...playingSounds, [item.name]: sound });
        
        const updatedLoading = { ...loadingSounds };
        delete updatedLoading[item.name];
        setLoadingSounds(updatedLoading);
      }
    } catch (error) {
      console.log("Erreur son :", error);
      showError(`Impossible de lire le son "${item.name}". Vérifiez que le fichier existe.`);
      
      const updatedLoading = { ...loadingSounds };
      delete updatedLoading[item.name];
      setLoadingSounds(updatedLoading);
    }
  };

  const setVolume = async (name: string, value: number): Promise<void> => {
    try {
      if (playingSounds[name]) {
        await playingSounds[name].setVolumeAsync(value);
      }
    } catch (error) {
      console.log("Erreur lors du changement de volume :", error);
      showError("Impossible de modifier le volume");
    }
  };

  const getCurrentSounds = (): SoundItem[] => {
    return activeTab === 'ambient' ? ambientSounds : whiteNoiseSounds;
  };

  const getTabTitle = (): string => {
    return activeTab === 'ambient' ? '🌿 Sons d\'Ambiance' : '📻 Bruits Blancs';
  };

  const getPlayingCount = (): number => {
    return Object.keys(playingSounds).length;
  };

  const stopAllSounds = async (): Promise<void> => {
    try {
      const soundsToStop = { ...playingSounds };
      
      await Promise.all(
        Object.entries(soundsToStop).map(async ([soundName, sound]: [string, Audio.Sound]) => {
          try {
            await sound.stopAsync();
            await sound.unloadAsync();
          } catch (error) {
            console.log(`Erreur lors de l'arrêt du son ${soundName}:`, error);
          }
        })
      );
      
      setPlayingSounds({});
      setShowStopModal(false);
      
    } catch (error) {
      console.log("Erreur lors de l'arrêt de tous les sons :", error);
    }
  };

  const stopSound = async (soundName: string): Promise<void> => {
    try {
      if (playingSounds[soundName]) {
        const sound = playingSounds[soundName];
        await sound.stopAsync();
        await sound.unloadAsync();
        
        setPlayingSounds((prevPlayingSounds: PlayingSoundsState) => {
          const updated = { ...prevPlayingSounds };
          delete updated[soundName];
          return updated;
        });
      }
    } catch (error) {
      console.log("Erreur lors de l'arrêt du son :", error);
    }
  };

  const getPlayingSoundsArray = (): Array<{ name: string; sound: Audio.Sound }> => {
    return Object.keys(playingSounds).map((name: string) => ({
      name,
      sound: playingSounds[name]
    }));
  };

  if (isPreloading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <View style={styles.loadingGlass}>
          <ActivityIndicator size="large" color="rgba(255, 255, 255, 0.9)" />
          <Text style={styles.loadingText}>Chargement des sons...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerGlass}>
        <Text style={styles.title}>🎶 Relaxation Player</Text>
        <Text style={styles.subtitle}>Créez votre ambiance parfaite</Text>
      </View>
      
      {getPlayingCount() > 0 && (
        <View style={styles.controlsGlass}>
          <View style={styles.playingCounter}>
            <Text style={styles.playingCounterText}>
              🎵 {getPlayingCount()} son{getPlayingCount() > 1 ? 's' : ''} en cours
            </Text>
          </View>
          <TouchableOpacity
            style={styles.stopButton}
            onPress={() => setShowStopModal(true)}
          >
            <Text style={styles.stopButtonText}>⏹️ STOP</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.tabGlass}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'ambient' ? styles.activeTab : null]}
          onPress={() => setActiveTab('ambient')}
        >
          <Text style={[styles.tabText, activeTab === 'ambient' ? styles.activeTabText : null]}>
            🌿 Ambiance
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'whitenoise' ? styles.activeTab : null]}
          onPress={() => setActiveTab('whitenoise')}
        >
          <Text style={[styles.tabText, activeTab === 'whitenoise' ? styles.activeTabText : null]}>
            📻 Bruits Blancs
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>{getTabTitle()}</Text>

      <FlatList<SoundItem>
        data={getCurrentSounds()}
        keyExtractor={(item: SoundItem) => item.name}
        renderItem={({ item }: { item: SoundItem }) => (
          <View style={[
            styles.cardGlass,
            playingSounds[item.name] && styles.cardActive
          ]}>
            <TouchableOpacity
              style={[
                styles.button,
                playingSounds[item.name] ? styles.buttonActive : null,
                loadingSounds[item.name] ? styles.buttonLoading : null,
              ]}
              onPress={() => playSound(item)}
              disabled={loadingSounds[item.name]}
            >
              <View style={styles.buttonContent}>
                {loadingSounds[item.name] ? (
                  <>
                    <ActivityIndicator size="small" color="rgba(255, 255, 255, 0.9)" style={styles.buttonLoader} />
                    <Text style={styles.buttonText}>Chargement...</Text>
                  </>
                ) : (
                  <Text style={styles.buttonText}>
                    {playingSounds[item.name] ? "⏸️ Pause" : "▶️ Play"} {item.name}
                    {preloadedSounds[item.name] && !playingSounds[item.name] && " ⚡"}
                  </Text>
                )}
              </View>
            </TouchableOpacity>

            <VolumeSlider 
              soundName={item.name}
              initialVolume={volumes[item.name] ?? 1.0}
              onVolumeChange={(name: string, volume: number) => {
                setVolumes({ ...volumes, [name]: volume });
                setVolume(name, volume);
              }}
            />
          </View>
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />

      <Modal
        visible={showStopModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowStopModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalGlass}>
            <Text style={styles.modalTitle}>Arrêter les sons</Text>
            
            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity
                style={styles.stopAllButton}
                onPress={stopAllSounds}
              >
                <Text style={styles.stopAllButtonText}>🛑 Arrêter TOUT</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>Ou arrêter individuellement :</Text>
            
            <FlatList<{ name: string; sound: Audio.Sound }>
              data={getPlayingSoundsArray()}
              keyExtractor={(item: { name: string; sound: Audio.Sound }) => item.name}
              style={styles.playingSoundsList}
              renderItem={({ item }: { item: { name: string; sound: Audio.Sound } }) => (
                <TouchableOpacity
                  style={styles.playingSoundItem}
                  onPress={() => {
                    stopSound(item.name);
                    if (getPlayingCount() <= 1) {
                      setShowStopModal(false);
                    }
                  }}
                >
                  <Text style={styles.playingSoundText}>⏸️ {item.name}</Text>
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowStopModal(false)}
            >
              <Text style={styles.modalCancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#0a0a0f",
    paddingTop: 60,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  headerGlass: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 28,
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 15,
  },
  title: { 
    fontSize: 32, 
    fontWeight: "800", 
    color: "rgba(255, 255, 255, 0.95)", 
    marginBottom: 8, 
    textAlign: "center",
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  loadingGlass: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 32,
    padding: 40,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 32,
    elevation: 20,
  },
  loadingText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 18,
    marginTop: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  controlsGlass: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    marginHorizontal: 20,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  playingCounter: {
    backgroundColor: "rgba(139, 92, 246, 0.25)",
    padding: 14,
    borderRadius: 18,
    flex: 1,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.3)",
  },
  playingCounterText: {
    color: "rgba(255, 255, 255, 0.95)",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.2,
  },
  stopButton: {
    backgroundColor: "rgba(239, 68, 68, 0.25)",
    padding: 14,
    borderRadius: 18,
    minWidth: 85,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.4)",
  },
  stopButtonText: {
    color: "rgba(255, 255, 255, 0.95)",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.3,
  },
  tabGlass: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 24,
    padding: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: "center",
    borderRadius: 18,
  },
  activeTab: {
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    shadowColor: "rgba(139, 92, 246, 0.6)",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  tabText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  activeTabText: {
    color: "rgba(255, 255, 255, 0.98)",
  },
  sectionTitle: {
    fontSize: 20,
    color: "rgba(255, 255, 255, 0.85)",
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  cardGlass: { 
    backgroundColor: "rgba(255, 255, 255, 0.07)",
    padding: 24, 
    marginBottom: 18, 
    borderRadius: 24,
    alignItems: "center", 
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35, 
    shadowRadius: 20, 
    elevation: 12,
  },
  cardActive: {
    backgroundColor: "rgba(139, 92, 246, 0.18)",
    borderColor: "rgba(139, 92, 246, 0.4)",
    shadowColor: "rgba(139, 92, 246, 0.5)",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 15,
  },
  button: { 
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    padding: 18, 
    borderRadius: 18, 
    marginBottom: 16, 
    width: "94%", 
    alignItems: "center",
    minHeight: 56,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.18)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonActive: { 
    backgroundColor: "rgba(139, 92, 246, 0.4)",
    borderColor: "rgba(139, 92, 246, 0.6)",
    shadowColor: "rgba(139, 92, 246, 0.7)",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  buttonLoading: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonLoader: {
    marginRight: 8,
  },
  buttonText: { 
    color: "rgba(255, 255, 255, 0.95)", 
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.3,
  },
  sliderContainer: {
    width: "94%",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  slider: {
    width: "100%",
    height: 28,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalGlass: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 28,
    padding: 28,
    width: "94%",
    maxHeight: "82%",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 35,
    elevation: 25,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "rgba(255, 255, 255, 0.95)",
    textAlign: "center",
    marginBottom: 24,
    letterSpacing: -0.5,
  },
  modalSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.75)",
    textAlign: "center",
    marginBottom: 18,
    marginTop: 18,
    fontWeight: "500",
  },
  modalButtonsContainer: {
    marginBottom: 18,
  },
  stopAllButton: {
    backgroundColor: "rgba(239, 68, 68, 0.3)",
    padding: 18,
    borderRadius: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.5)",
    shadowColor: "rgba(239, 68, 68, 0.5)",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  stopAllButtonText: {
    color: "rgba(255, 255, 255, 0.95)",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  playingSoundsList: {
    maxHeight: 220,
  },
  playingSoundItem: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.18)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  playingSoundText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  modalCancelButton: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 18,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  
  modalCancelText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
});