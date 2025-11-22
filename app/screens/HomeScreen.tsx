import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSongs } from '../hooks/useSongs';
import { AppLayout } from '../components/AppLayout';

export function HomeScreen() {
  const navigation = useNavigation<any>();
  const { songs, loading, fetchSongs } = useSongs();

  // Refetch songs when screen comes into focus
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchSongs();
    });
    return unsubscribe;
  }, [navigation, fetchSongs]);

  const recentSongs = songs.slice(0, 3);

  const sidebarContent = (
    <View>
      <Text style={{ fontSize: 14, color: '#4B5563', fontWeight: '600', marginBottom: 12 }}>Recently Viewed</Text>
      
      {loading ? (
        <Text style={{ fontSize: 12, color: '#6B7280' }}>Loading...</Text>
      ) : recentSongs.length === 0 ? (
        <Text style={{ fontSize: 12, color: '#6B7280' }}>No songs yet</Text>
      ) : (
        recentSongs.map(song => (
          <TouchableOpacity
            key={song.id}
            onPress={() => navigation.navigate('SongViewer', { songId: song.id })}
            style={{ backgroundColor: 'white', borderRadius: 8, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#E5E7EB' }}
          >
            <Text style={{ fontSize: 14, color: '#111827', fontWeight: '600', marginBottom: 4 }}>
              {song.title}
            </Text>
            <Text style={{ fontSize: 12, color: '#4B5563' }}>
              {song.artist || 'Unknown Artist'}
            </Text>
          </TouchableOpacity>
        ))
      )}
    </View>
  );

  return (
    <AppLayout sidebarContent={sidebarContent}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 16 }}>Songs</Text>
      
      {loading ? (
        <Text style={{ color: '#6B7280' }}>Loading...</Text>
      ) : songs.length === 0 ? (
        <Text style={{ color: '#6B7280' }}>No songs yet. Add your first song!</Text>
      ) : (
        <ScrollView>
          {songs.map((song, index) => (
            <TouchableOpacity
              key={song.id}
              onPress={() => navigation.navigate('SongViewer', { songId: song.id })}
              style={{ paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, color: '#111827', fontWeight: '600', marginBottom: 4 }}>
                  {song.title}
                </Text>
                <Text style={{ fontSize: 14, color: '#4B5563' }}>
                  {song.artist || 'Unknown Artist'}
                </Text>
              </View>
              <Text style={{ fontSize: 20, color: '#9333EA', marginLeft: 16 }}>›</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </AppLayout>
  );
}

