import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Dimensions, 
  ScrollView, 
  SafeAreaView, 
  TextInput,
  Modal,
  Alert
} from 'react-native';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring, 
  runOnJS,
  FadeIn,
  FadeOut,
  SlideInDown,
  Layout
} from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Plus, X, Check, Trash2, Calendar, TrendingUp } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');
const COLUMNS = 2;
const GAP = 15;
const ITEM_SIZE = (width - (GAP * (COLUMNS + 1))) / COLUMNS;

const DEFAULT_HABITS = [
  { id: '1', title: 'Morning Run', color: '#FF6B6B', icon: '🏃', completedDays: [] },
  { id: '2', title: 'Read Book', color: '#4ECDC4', icon: '📚', completedDays: [] },
  { id: '3', title: 'Drink Water', color: '#45B7D1', icon: '💧', completedDays: [] },
  { id: '4', title: 'Meditation', color: '#96CEB4', icon: '🧘', completedDays: [] },
];

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5', '#A29BFE', '#FAB1A0'];
const ICONS = ['🏃', '📚', '💧', '🧘', '💻', '✍️', '🥦', '🎸', '🌱', '☀️'];

const HabitItem = ({ item, onPress, onLongPress }) => {
  const isCompletedToday = item.completedDays.includes(new Date().toDateString());
  
  return (
    <TouchableOpacity 
      activeOpacity={0.8} 
      onPress={() => onPress(item)}
      onLongPress={() => onLongPress(item)}
    >
      <Animated.View 
        layout={Layout.springify()}
        entering={FadeIn.duration(400)}
        style={[styles.habitItem, { backgroundColor: item.color }]}
      >
        <Text style={styles.habitIcon}>{item.icon}</Text>
        <Text style={styles.habitTitle} numberOfLines={1}>{item.title}</Text>
        {isCompletedToday && (
          <View style={styles.completedBadge}>
            <Check size={12} color="#fff" strokeWidth={3} />
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

const HabitSpace = ({ item, onClose, onToggleComplete, onDelete }) => {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const isCompletedToday = item.completedDays.includes(new Date().toDateString());

  useEffect(() => {
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
      if (e.scale < 1) scale.value = e.scale;
    })
    .onEnd((e) => {
      if (e.scale < 0.8) runOnJS(close)();
      else scale.value = withSpring(1);
    });

  return (
    <GestureDetector gesture={pinchGesture}>
      <Animated.View style={[styles.spaceContainer, animatedStyle, { backgroundColor: item.color }]}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={close} style={styles.circleBtn}>
              <X size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.spaceTitle}>{item.title}</Text>
            <TouchableOpacity 
              onPress={() => {
                Alert.alert("Delete Habit", "Are you sure you want to remove this habit?", [
                  { text: "Cancel", style: "cancel" },
                  { text: "Delete", style: "destructive", onPress: () => {
                    onDelete(item.id);
                    onClose();
                  }}
                ]);
              }} 
              style={styles.circleBtn}
            >
              <Trash2 size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <ScrollView contentContainerStyle={styles.spaceContent}>
            <Text style={styles.bigIcon}>{item.icon}</Text>
            
            <TouchableOpacity 
              style={[styles.checkInBtn, isCompletedToday && styles.checkInBtnDone]}
              onPress={() => onToggleComplete(item.id)}
            >
              {isCompletedToday ? (
                <View style={styles.row}>
                  <Check size={24} color="#fff" style={{ marginRight: 10 }} />
                  <Text style={styles.checkInText}>Completed Today!</Text>
                </View>
              ) : (
                <Text style={styles.checkInText}>Check In for Today</Text>
              )}
            </TouchableOpacity>

            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <TrendingUp size={24} color="#fff" />
                <Text style={styles.statNumber}>{item.completedDays.length}</Text>
                <Text style={styles.statLabel}>Total Days</Text>
              </View>
              <View style={styles.statBox}>
                <Calendar size={24} color="#fff" />
                <Text style={styles.statNumber}>
                  {item.completedDays.length > 0 ? 'Active' : 'New'}
                </Text>
                <Text style={styles.statLabel}>Status</Text>
              </View>
            </View>

            <Text style={styles.instructions}>
              Pinch in to zoom out and return to your dashboard.
            </Text>
          </ScrollView>
        </SafeAreaView>
      </Animated.View>
    </GestureDetector>
  );
};

export default function App() {
  const [habits, setHabits] = useState([]);
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(ICONS[0]);

  useEffect(() => {
    loadHabits();
  }, []);

  const loadHabits = async () => {
    try {
      const saved = await AsyncStorage.getItem('habits');
      if (saved) setHabits(JSON.parse(saved));
      else setHabits(DEFAULT_HABITS);
    } catch (e) {
      setHabits(DEFAULT_HABITS);
    }
  };

  const saveHabits = async (updatedHabits) => {
    try {
      await AsyncStorage.setItem('habits', JSON.stringify(updatedHabits));
    } catch (e) {
      console.error('Failed to save habits');
    }
  };

  const addHabit = () => {
    if (!newHabitTitle.trim()) return;
    const newHabit = {
      id: Date.now().toString(),
      title: newHabitTitle,
      color: selectedColor,
      icon: selectedIcon,
      completedDays: []
    };
    const updated = [...habits, newHabit];
    setHabits(updated);
    saveHabits(updated);
    setIsModalVisible(false);
    setNewHabitTitle('');
  };

  const deleteHabit = (id) => {
    const updated = habits.filter(h => h.id !== id);
    setHabits(updated);
    saveHabits(updated);
  };

  const toggleComplete = (id) => {
    const today = new Date().toDateString();
    const updated = habits.map(h => {
      if (h.id === id) {
        const completedDays = [...h.completedDays];
        const index = completedDays.indexOf(today);
        if (index > -1) completedDays.splice(index, 1);
        else completedDays.push(today);
        return { ...h, completedDays };
      }
      return h;
    });
    setHabits(updated);
    saveHabits(updated);
    if (selectedHabit && selectedHabit.id === id) {
      setSelectedHabit(updated.find(h => h.id === id));
    }
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar style="light" />
      
      <SafeAreaView style={styles.flex}>
        <View style={styles.gridHeader}>
          <Text style={styles.appTitle}>Habbit Space</Text>
          <TouchableOpacity 
            style={styles.addBtn} 
            onPress={() => setIsModalVisible(true)}
          >
            <Plus size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.grid}>
          {habits.map((habit) => (
            <HabitItem 
              key={habit.id} 
              item={habit} 
              onPress={setSelectedHabit}
              onLongPress={(h) => Alert.alert(h.title, "Zoom in to see details and manage this habit.")}
            />
          ))}
        </ScrollView>
      </SafeAreaView>

      {/* Modal for adding new habits */}
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <Animated.View entering={SlideInDown} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Habit</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <X size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Habit Name (e.g. Yoga)"
              value={newHabitTitle}
              onChangeText={setNewHabitTitle}
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>Choose Color</Text>
            <View style={styles.colorRow}>
              {COLORS.map(c => (
                <TouchableOpacity 
                  key={c} 
                  onPress={() => setSelectedColor(c)}
                  style={[styles.colorCircle, { backgroundColor: c }, selectedColor === c && styles.selectedCircle]} 
                />
              ))}
            </View>

            <Text style={styles.label}>Choose Icon</Text>
            <View style={styles.iconRow}>
              {ICONS.map(i => (
                <TouchableOpacity 
                  key={i} 
                  onPress={() => setSelectedIcon(i)}
                  style={[styles.iconCircle, selectedIcon === i && styles.selectedIconCircle]}
                >
                  <Text style={{ fontSize: 20 }}>{i}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.createBtn} onPress={addHabit}>
              <Text style={styles.createBtnText}>Create Space</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {/* Zoomed In Space View */}
      {selectedHabit && (
        <View style={styles.overlay}>
          <HabitSpace 
            item={selectedHabit} 
            onClose={() => setSelectedHabit(null)}
            onToggleComplete={toggleComplete}
            onDelete={deleteHabit}
          />
        </View>
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  flex: { flex: 1 },
  gridHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingTop: 20,
    marginBottom: 20,
  },
  appTitle: { fontSize: 32, fontWeight: '900', color: '#fff' },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: GAP,
    paddingBottom: 40,
  },
  habitItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    margin: GAP / 2,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  habitIcon: { fontSize: 42, marginBottom: 8 },
  habitTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a1a', paddingHorizontal: 10 },
  completedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    padding: 4,
  },
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 100 },
  spaceContainer: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  spaceTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  spaceContent: { alignItems: 'center', paddingTop: 40, paddingHorizontal: 30 },
  bigIcon: { fontSize: 100, marginBottom: 30 },
  checkInBtn: {
    width: '100%',
    padding: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    marginBottom: 30,
  },
  checkInBtnDone: { backgroundColor: 'rgba(0,0,0,0.2)' },
  checkInText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  statsContainer: { flexDirection: 'row', gap: 15, marginBottom: 40 },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 20,
    borderRadius: 24,
    alignItems: 'center',
  },
  statNumber: { fontSize: 28, fontWeight: '900', color: '#fff', marginVertical: 5 },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  instructions: { color: 'rgba(255,255,255,0.5)', fontSize: 14, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 30,
    minHeight: height * 0.6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  modalTitle: { fontSize: 24, fontWeight: '800', color: '#333' },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 18,
    borderRadius: 15,
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
  },
  label: { fontSize: 14, fontWeight: '700', color: '#666', marginBottom: 12, marginTop: 10 },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  colorCircle: { width: 35, height: 35, borderRadius: 17.5 },
  selectedCircle: { borderWidth: 3, borderColor: '#333' },
  iconRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 30 },
  iconCircle: { 
    width: 45, 
    height: 45, 
    borderRadius: 12, 
    backgroundColor: '#f5f5f5', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  selectedIconCircle: { backgroundColor: '#e0e0e0', borderWidth: 2, borderColor: '#333' },
  createBtn: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
  },
  createBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
