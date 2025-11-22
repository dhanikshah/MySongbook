import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

interface AppLayoutProps {
  children: React.ReactNode;
  headerTitle?: string;
  headerRight?: React.ReactNode;
  showBackButton?: boolean;
  sidebarContent?: React.ReactNode;
}

export function AppLayout({ children, headerTitle = 'My Songbook', headerRight, showBackButton = false, sidebarContent }: AppLayoutProps) {
  const navigation = useNavigation<any>();

  return (
    <View className="flex-1" style={{ backgroundColor: '#F3F4F6' }}>
      {/* Purple Header */}
      <View className="bg-purple-600 px-6 py-3 flex-row justify-between items-center" style={{ minHeight: 56 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {showBackButton && (
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 16 }}>
              <Text style={{ fontSize: 20, color: 'white' }}>←</Text>
            </TouchableOpacity>
          )}
          <Text className="text-white" style={{ fontSize: 20, fontWeight: 'bold' }}>{headerTitle}</Text>
        </View>
        {headerRight || (
          <TouchableOpacity>
            <View style={{ width: 32, height: 32, backgroundColor: 'white', borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 16, color: '#9333EA' }}>👤</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      <View className="flex-1 flex-row">
        {/* Left Sidebar */}
        <View style={{ width: 240, backgroundColor: 'white', borderRightWidth: 1, borderRightColor: '#E5E7EB', padding: 16 }}>
          <TouchableOpacity
            onPress={() => navigation.navigate('AddSong')}
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingVertical: 8 }}
          >
            <Text style={{ fontSize: 20, color: '#9333EA', marginRight: 12 }}>+</Text>
            <Text style={{ fontSize: 14, color: '#111827', fontWeight: '500' }}>Add New Song</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Library')}
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingVertical: 8 }}
          >
            <Text style={{ fontSize: 20, color: '#9333EA', marginRight: 12 }}>📁</Text>
            <Text style={{ fontSize: 14, color: '#111827', fontWeight: '500' }}>Browse Library</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Library')}
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24, paddingVertical: 8 }}
          >
            <Text style={{ fontSize: 20, color: '#9333EA', marginRight: 12 }}>🔍</Text>
            <Text style={{ fontSize: 14, color: '#111827', fontWeight: '500' }}>Search by Tags</Text>
          </TouchableOpacity>

          {sidebarContent}
        </View>

        {/* Main Content */}
        <View style={{ flex: 1, backgroundColor: 'white', padding: 24 }}>
          {children}
        </View>
      </View>
    </View>
  );
}

