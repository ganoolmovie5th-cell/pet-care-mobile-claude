import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PlaydateFeedScreen } from '../screens/playdate/PlaydateFeedScreen';
import { PostPlaydateScreen } from '../screens/playdate/PostPlaydateScreen';
import { PlaydateDetailScreen } from '../screens/playdate/PlaydateDetailScreen';
import { PlaydateChatScreen } from '../screens/playdate/PlaydateChatScreen';
import { PlaydatePost } from '../services/playdate';

export type PlaydateStackParamList = {
  Feed: undefined;
  Detail: { post: PlaydatePost };
  Create: undefined;
  Chat: { matchId: string; ownerId: string };
};

const Stack = createNativeStackNavigator<PlaydateStackParamList>();

export const PlaydateStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#ff9800',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen
        name="Feed"
        options={{ title: 'Playdates' }}
      >
        {(props: any) => (
          <PlaydateFeedScreen
            onSelectPost={(postId) => {
              props.navigation.navigate('Detail', {
                post: { id: postId } as PlaydatePost,
              });
            }}
            onCreatePost={() => {
              props.navigation.navigate('Create');
            }}
          />
        )}
      </Stack.Screen>

      <Stack.Screen
        name="Detail"
        options={{ title: 'Playdate Details' }}
      >
        {(props: any) => (
          <PlaydateDetailScreen
            post={props.route.params.post}
            onChat={(ownerId: string) => {
              props.navigation.navigate('Chat', {
                matchId: '',
                ownerId,
              });
            }}
          />
        )}
      </Stack.Screen>

      <Stack.Screen
        name="Create"
        options={{ title: 'Create Playdate' }}
      >
        {(props: any) => (
          <PostPlaydateScreen
            onSave={() => {
              props.navigation.goBack();
            }}
          />
        )}
      </Stack.Screen>

      <Stack.Screen
        name="Chat"
        options={{ title: 'Chat' }}
      >
        {(props: any) => (
          <PlaydateChatScreen
            matchId={props.route.params.matchId}
            ownerId={props.route.params.ownerId}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};
