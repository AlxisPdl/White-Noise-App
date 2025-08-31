import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Modal } from "react-native";
import Slider from "@react-native-community/slider";
import { Audio } from "expo-av";

const ambientSounds = [
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
  { name: "Water Dripping", file: require("../../assets/ambiant/water-dripping-1.mp3") },
  { name: "Wind 1", file: require("../../assets/ambiant/wind-1.mp3") },
  { name: "Wind Chime 2", file: require("../../assets/ambiant/wind-chime-2.mp3") },
  { name: "Wind Gust 01", file: require("../../assets/ambiant/wind-gust-01.mp3") },
  { name: "Wind Howl 01", file: require("../../assets/ambiant/wind-howl-01.mp3") },
  { name: "Windy Forest Ambience 01", file: require("../../assets/ambiant/windy-forest-ambience-01.mp3") },
];

const whiteNoiseSounds = [
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

// Composant séparé pour le slider pour éviter les conflits d'état
const VolumeSlider = ({ soundName, initialVolume, onVolumeChange }: { 
  soundName: string, 
  initialVolume: number, 
  onVolumeChange: (name: string, volume: number) => void 
}) => {
  const [localVolume, setLocalVolume] = useState(initialVolume);

  const handleSliderChange = (value: number) => {
    setLocalVolume(value);
  };

  const handleSliderComplete = (value: number) => {
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
        minimumTrackTintColor="#8a2be2"
        maximumTrackTintColor="#ccc"
        thumbTintColor="#8a2be2"
      />
    </View>
  );
};

export default function SoundBoard() {
  const [playingSounds, setPlayingSounds] = useState<{ [key: string]: Audio.Sound }>({});
  const [volumes, setVolumes] = useState<{ [key: string]: number }>({});
  const [preloadedSounds, setPreloadedSounds] = useState<{ [key: string]: Audio.Sound }>({});
  const [loadingSounds, setLoadingSounds] = useState<{ [key: string]: boolean }>({});
  const [isPreloading, setIsPreloading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ambient' | 'whitenoise'>('ambient');
  const [showStopModal, setShowStopModal] = useState(false);

  // Pré-charger les sons les plus populaires au démarrage
  useEffect(() => {
    const preloadPopularSounds = async () => {
      const popularSounds = ["Ocean", "Rain 01", "Fire", "White Noise 1"]; // Sons populaires à pré-charger
      const preloaded: { [key: string]: Audio.Sound } = {};
      
      try {
        for (const soundName of popularSounds) {
          // Chercher dans les deux catégories
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

  // Cleanup lors du démontage du composant
  useEffect(() => {
    return () => {
      // Nettoyer tous les sons en cours de lecture
      Object.values(playingSounds).forEach(async (sound) => {
        try {
          await sound.stopAsync();
          await sound.unloadAsync();
        } catch (e) {
          console.log("Erreur lors du nettoyage :", e);
        }
      });

      // Nettoyer les sons pré-chargés (seulement ceux qui ne sont pas en cours de lecture)
      Object.entries(preloadedSounds).forEach(([name, sound]) => {
        if (!playingSounds[name]) {
          try {
            sound.unloadAsync();
          } catch (e) {
            console.log("Erreur lors du nettoyage des sons pré-chargés :", e);
          }
        }
      });
    };
  }, []);

  const showError = (message: string) => {
    Alert.alert(
      "Erreur Audio",
      message,
      [{ text: "OK", style: "default" }]
    );
  };

  const playSound = async (item: any) => {
    try {
      // Si le son est déjà en cours de chargement, ignorer
      if (loadingSounds[item.name]) return;

      if (playingSounds[item.name]) {
        // Arrêter le son
        await playingSounds[item.name].stopAsync();
        await playingSounds[item.name].unloadAsync();
        const updated = { ...playingSounds };
        delete updated[item.name];
        setPlayingSounds(updated);
      } else {
        // Afficher l'indicateur de chargement
        setLoadingSounds({ ...loadingSounds, [item.name]: true });

        let sound: Audio.Sound;

        // Utiliser le son pré-chargé si disponible
        if (preloadedSounds[item.name]) {
          sound = preloadedSounds[item.name];
          await sound.setVolumeAsync(volumes[item.name] ?? 1.0);
          await sound.setIsLoopingAsync(true);
          await sound.playAsync();
        } else {
          // Charger le son normalement
          const { sound: newSound } = await Audio.Sound.createAsync(item.file, {
            isLooping: true,
            volume: volumes[item.name] ?? 1.0,
          });
          sound = newSound;
          await sound.playAsync();
        }

        setPlayingSounds({ ...playingSounds, [item.name]: sound });
        
        // Retirer l'indicateur de chargement
        const updatedLoading = { ...loadingSounds };
        delete updatedLoading[item.name];
        setLoadingSounds(updatedLoading);
      }
    } catch (error) {
      console.log("Erreur son :", error);
      showError(`Impossible de lire le son "${item.name}". Vérifiez que le fichier existe.`);
      
      // Retirer l'indicateur de chargement en cas d'erreur
      const updatedLoading = { ...loadingSounds };
      delete updatedLoading[item.name];
      setLoadingSounds(updatedLoading);
    }
  };

  const setVolume = async (name: string, value: number) => {
    try {
      if (playingSounds[name]) {
        await playingSounds[name].setVolumeAsync(value);
      }
    } catch (error) {
      console.log("Erreur lors du changement de volume :", error);
      showError("Impossible de modifier le volume");
    }
  };

  const getCurrentSounds = () => {
    return activeTab === 'ambient' ? ambientSounds : whiteNoiseSounds;
  };

  const getTabTitle = () => {
    return activeTab === 'ambient' ? '🌿 Sons d\'Ambiance' : '📻 Bruits Blancs';
  };

  const getPlayingCount = () => {
    return Object.keys(playingSounds).length;
  };

  const stopSound = async (soundName: string) => {
    try {
      if (playingSounds[soundName]) {
        await playingSounds[soundName].stopAsync();
        await playingSounds[soundName].unloadAsync();
        const updated = { ...playingSounds };
        delete updated[soundName];
        setPlayingSounds(updated);
      }
    } catch (error) {
      console.log("Erreur lors de l'arrêt du son :", error);
    }
  };

  const stopAllSounds = async () => {
    try {
      const soundNames = Object.keys(playingSounds);
      for (const soundName of soundNames) {
        await stopSound(soundName);
      }
      setShowStopModal(false);
    } catch (error) {
      console.log("Erreur lors de l'arrêt de tous les sons :", error);
    }
  };

  const getPlayingSoundsArray = () => {
    return Object.keys(playingSounds).map(name => ({
      name,
      sound: playingSounds[name]
    }));
  };

  if (isPreloading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#8a2be2" />
        <Text style={styles.loadingText}>Chargement des sons...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎶 Relaxation Player</Text>
      
      {/* Compteur de sons en cours et bouton STOP */}
      {getPlayingCount() > 0 && (
        <View style={styles.controlsContainer}>
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

      {/* Navigation par onglets */}
      <View style={styles.tabContainer}>
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

      {/* Titre de la section active */}
      <Text style={styles.sectionTitle}>{getTabTitle()}</Text>

      {/* Liste des sons */}
      <FlatList
        data={getCurrentSounds()}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => (
          <View style={styles.card}>
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
                    <ActivityIndicator size="small" color="#fff" style={styles.buttonLoader} />
                    <Text style={styles.buttonText}>Chargement...</Text>
                  </>
                ) : (
                  <Text style={styles.buttonText}>
                    {playingSounds[item.name] ? "⏸️ Stop" : "▶️ Play"} {item.name}
                    {preloadedSounds[item.name] && !playingSounds[item.name] && " ⚡"}
                  </Text>
                )}
              </View>
            </TouchableOpacity>

            <VolumeSlider 
              soundName={item.name}
              initialVolume={volumes[item.name] ?? 1.0}
              onVolumeChange={(name, volume) => {
                setVolumes({ ...volumes, [name]: volume });
                setVolume(name, volume);
              }}
            />
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />

      {/* Modal pour arrêter les sons */}
      <Modal
        visible={showStopModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowStopModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
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
            
            <FlatList
              data={getPlayingSoundsArray()}
              keyExtractor={(item) => item.name}
              style={styles.playingSoundsList}
              renderItem={({ item }) => (
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
    backgroundColor: "#1a1a1a", 
    padding: 20, 
    paddingTop: 50 
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  title: { 
    fontSize: 24, 
    fontWeight: "bold", 
    color: "#fff", 
    marginBottom: 20, 
    textAlign: "center" 
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 10,
  },
  playingCounter: {
    backgroundColor: "#8a2be2",
    padding: 8,
    borderRadius: 20,
    flex: 1,
    marginRight: 10,
  },
  playingCounterText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  controlsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  stopButton: {
    backgroundColor: "#dc3545",
    padding: 8,
    borderRadius: 20,
    minWidth: 80,
  },
  stopButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: 20,
    backgroundColor: "#2a2a2a",
    borderRadius: 25,
    padding: 4,
  },
  tab: {
    flex: 1,
    padding: 12,
    alignItems: "center",
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: "#8a2be2",
  },
  tabText: {
    color: "#ccc",
    fontSize: 16,
    fontWeight: "600",
  },
  activeTabText: {
    color: "#fff",
  },
  sectionTitle: {
    fontSize: 18,
    color: "#fff",
    textAlign: "center",
    marginBottom: 15,
    opacity: 0.8,
  },
  card: { 
    backgroundColor: "#2a2a2a", 
    padding: 15, 
    marginBottom: 15, 
    borderRadius: 12, 
    alignItems: "center", 
    shadowColor: "#000", 
    shadowOpacity: 0.3, 
    shadowRadius: 5, 
    elevation: 5 
  },
  button: { 
    backgroundColor: "#444", 
    padding: 10, 
    borderRadius: 8, 
    marginBottom: 10, 
    width: "80%", 
    alignItems: "center",
    minHeight: 45,
    justifyContent: "center",
  },
  buttonActive: { 
    backgroundColor: "#8a2be2" 
  },
  buttonLoading: {
    backgroundColor: "#666",
    opacity: 0.7,
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
    color: "#fff", 
    fontSize: 16,
    textAlign: "center",
  },
  sliderContainer: {
    width: "80%",
    alignItems: "center",
  },
  slider: {
    width: "100%",
    height: 20,
  },
  // Styles pour le modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#2a2a2a",
    borderRadius: 15,
    padding: 20,
    width: "90%",
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
  },
  modalSubtitle: {
    fontSize: 16,
    color: "#ccc",
    textAlign: "center",
    marginBottom: 15,
    marginTop: 10,
  },
  modalButtonsContainer: {
    marginBottom: 10,
  },
  stopAllButton: {
    backgroundColor: "#dc3545",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  stopAllButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  playingSoundsList: {
    maxHeight: 200,
  },
  playingSoundItem: {
    backgroundColor: "#444",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: "center",
  },
  playingSoundText: {
    color: "#fff",
    fontSize: 14,
  },
  modalCancelButton: {
    backgroundColor: "#666",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 15,
  },
  modalCancelText: {
    color: "#fff",
    fontSize: 14,
  },
});