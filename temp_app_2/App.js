import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, ScrollView, SafeAreaView } from 'react-native';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring, 
  interpolate, 
  Extrapolation,
  runOnJS,
  FadeIn,
  FadeOut,
  ZoomIn,
  ZoomOut
} from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');
const COLUMNS = 2;
const GAP = 15;
const ITEM_SIZE = (width - (GAP * (COLUMNS + 1))) / COLUMNS;

const HABITS = [
  { id: 1, title: 'Morning Run', color: '#FF6B6B', icon: '🏃' },
  { id: 2, title: 'Read Book', color: '#4ECDC4', icon: '📚' },
  { id: 3, title: 'Drink Water', color: '#45B7D1', icon: '💧' },
  { id: 4, title: 'Meditation', color: '#96CEB4', icon: '🧘' },
  { id: 5, title: 'Coding', color: '#FFEEAD', icon: '💻' },
  { id: 6, title: 'Journaling', color: '#D4A5A5', icon: '✍️' },
];

const HabitItem = ({ item, onPress }) => {
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={() => onPress(item)}>
      <Animated.View style={[styles.habitItem, { backgroundColor: item.color }]}>
        <Text style={styles.habitIcon}>{item.icon}</Text>
        <Text style={styles.habitTitle}>{item.title}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const HabitSpace = ({ item, onClose }) => {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    scale.value = withSpring(1);
    opacity.value = withTiming(1);
  }, []);

  const close = () => {
    scale.value = withTiming(0.8);
    opacity.value = withTiming(0, {}, () => {
      runOnJS(onClose)();
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      if (e.scale < 1) {
        scale.value = e.scale;
      }
    })
    .onEnd((e) => {
      if (e.scale < 0.8) {
        runOnJS(close)();
      } else {
        scale.value = withSpring(1);
      }
    });

  return (
    <GestureDetector gesture={pinchGesture}>
      <Animated.View style={[styles.spaceContainer, animatedStyle, { backgroundColor: item.color }]}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={close} style={styles.backButton}>
              <Text style={styles.backButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.spaceTitle}>{item.title} Space</Text>
          </View>
          
          <View style={styles.content}>
            <Text style={styles.bigIcon}>{item.icon}</Text>
            <Text style={styles.description}>
              Welcome to your {item.title} space. 
              Pinch in to zoom out back to the grid.
            </Text>
            
            {/* Mock Content for the Space */}
            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>12</Text>
                <Text style={styles.statLabel}>Days Streak</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>85%</Text>
                <Text style={styles.statLabel}>Completion</Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </Animated.View>
    </GestureDetector>
  );
};

export default function App() {
  const [selectedHabit, setSelectedHabit] = useState(null);

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Grid View */}
      <View style={styles.gridContainer}>
        <Text style={styles.appTitle}>My Habits</Text>
        <ScrollView contentContainerStyle={styles.grid}>
          {HABITS.map((habit) => (
            <HabitItem 
              key={habit.id} 
              item={habit} 
              onPress={setSelectedHabit} 
            />
          ))}
        </ScrollView>
      </View>

      {/* Zoomed In Space View */}
      {selectedHabit && (
        <View style={styles.overlay}>
          <HabitSpace 
            item={selectedHabit} 
            onClose={() => setSelectedHabit(null)} 
          />
        </View>
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  gridContainer: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: GAP,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    marginLeft: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
    paddingBottom: 40,
  },
  habitItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: GAP,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  habitIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  habitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  spaceContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  backButtonText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  spaceTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  bigIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  description: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 40,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 20,
  },
  statBox: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    minWidth: 120,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 5,
  },
});
