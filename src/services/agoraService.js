import {
  createAgoraRtcEngine,
  ChannelProfileType,
  ClientRoleType,
} from 'react-native-agora';

class AgoraService {
  constructor() {
    this.appId = '6cfefbb323dc4c1eba6bf5d431ac3187';
    this.engine = null;
    // For production: implement token generation on backend
    // For now: Disable App Certificate in Agora Console for testing
  }

  async init() {
    try {
      if (this.engine) {
        console.log('Agora: Already initialized');
        return this.engine;
      }

      console.log('Agora: Creating RTC engine...');
      this.engine = createAgoraRtcEngine();
      
      await this.engine.initialize({
        appId: this.appId,
      });
      
      console.log('Agora: Engine initialized successfully');
      return this.engine;
    } catch (error) {
      console.error('Agora: Init error:', error);
      throw error;
    }
  }

  async getToken(channelName, uid = 0) {
    try {
      // Call Firebase Cloud Function to generate token
      const response = await fetch('https://us-central1-dexxire-dfcba.cloudfunctions.net/generateAgoraToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channelName,
          uid,
          role: 'publisher'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Agora: Token server error:', errorText);
        throw new Error('Failed to get Agora token from server');
      }

      const data = await response.json();
      console.log('Agora: Token received from server');
      return data.token;
    } catch (error) {
      console.error('Agora: Failed to get token:', error);
      throw error;
    }
  }

  async startCall(channelName, isAudioOnly = false, uid = 0) {
    try {
      if (!this.engine) {
        await this.init();
      }

      console.log('Agora: Starting call, channel:', channelName, 'audioOnly:', isAudioOnly);

      // Get token from backend
      const token = await this.getToken(channelName, uid);

      // Enable audio
      await this.engine.enableAudio();
      
      // Enable video if not audio-only
      if (!isAudioOnly) {
        await this.engine.enableVideo();
      }

      // Set channel profile to communication (for calls)
      await this.engine.setChannelProfile(ChannelProfileType.ChannelProfileCommunication);
      
      // Set client role to broadcaster
      await this.engine.setClientRole(ClientRoleType.ClientRoleBroadcaster);

      // Join channel with token
      const result = await this.engine.joinChannel(
        token,
        channelName,
        uid,
        {}
      );

      console.log('Agora: Join channel result:', result);
      
      if (result < 0) {
        throw new Error(`Failed to join channel, error code: ${result}`);
      }

      console.log('Agora: Joined channel successfully');
      return true;
    } catch (error) {
      console.error('Agora: Start call error:', error);
      throw error;
    }
  }

  async endCall() {
    try {
      if (this.engine) {
        console.log('Agora: Leaving channel...');
        await this.engine.leaveChannel();
        console.log('Agora: Left channel successfully');
      }
    } catch (error) {
      console.error('Agora: End call error:', error);
    }
  }

  async toggleMute(muted) {
    try {
      if (this.engine) {
        await this.engine.muteLocalAudioStream(muted);
        console.log('Agora: Audio muted:', muted);
      }
    } catch (error) {
      console.error('Agora: Toggle mute error:', error);
    }
  }

  async toggleVideo(enabled) {
    try {
      if (this.engine) {
        await this.engine.muteLocalVideoStream(!enabled);
        console.log('Agora: Video enabled:', enabled);
      }
    } catch (error) {
      console.error('Agora: Toggle video error:', error);
    }
  }

  async switchCamera() {
    try {
      if (this.engine) {
        await this.engine.switchCamera();
        console.log('Agora: Camera switched');
      }
    } catch (error) {
      console.error('Agora: Switch camera error:', error);
    }
  }

  async enableSpeakerphone(enabled) {
    try {
      if (this.engine) {
        await this.engine.setEnableSpeakerphone(enabled);
        console.log('Agora: Speakerphone:', enabled);
      }
    } catch (error) {
      console.error('Agora: Enable speakerphone error:', error);
    }
  }

  registerEventHandlers(handlers) {
    if (!this.engine) {
      console.warn('Agora: Engine not initialized, cannot register event handlers');
      return;
    }

    this.engine.registerEventHandler({
      onJoinChannelSuccess: (connection, elapsed) => {
        console.log('Agora: Join channel success:', connection.channelId);
        handlers.onJoinChannelSuccess?.(connection, elapsed);
      },
      onUserJoined: (connection, remoteUid, elapsed) => {
        console.log('Agora: User joined:', remoteUid);
        handlers.onUserJoined?.(connection, remoteUid, elapsed);
      },
      onUserOffline: (connection, remoteUid, reason) => {
        console.log('Agora: User offline:', remoteUid);
        handlers.onUserOffline?.(connection, remoteUid, reason);
      },
      onLeaveChannel: (connection, stats) => {
        console.log('Agora: Left channel');
        handlers.onLeaveChannel?.(connection, stats);
      },
      onError: (err, msg) => {
        console.error('Agora: Error:', err, msg);
        handlers.onError?.(err, msg);
      },
    });
  }

  async destroy() {
    try {
      if (this.engine) {
        console.log('Agora: Destroying engine...');
        await this.engine.release();
        this.engine = null;
        console.log('Agora: Engine destroyed');
      }
    } catch (error) {
      console.error('Agora: Destroy error:', error);
    }
  }

  getEngine() {
    return this.engine;
  }
}

export default new AgoraService();

