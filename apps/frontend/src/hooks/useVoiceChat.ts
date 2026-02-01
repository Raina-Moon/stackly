import { useState, useEffect, useCallback, useRef } from 'react';
import SimplePeer from 'simple-peer';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';
import { getSocket } from '@/lib/socket';
import type { VoiceOfferEvent, VoiceAnswerEvent, VoiceIceCandidateEvent } from '@/lib/socket';
import { createAudioLevel } from '@stackly/proto';

const USE_PROTOBUF = process.env.NEXT_PUBLIC_USE_PROTOBUF === 'true';

interface PeerConnection {
  peerId: string;
  peer: SimplePeer.Instance;
}

interface UseVoiceChatOptions {
  boardId: string | undefined;
}

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export function useVoiceChat({ boardId }: UseVoiceChatOptions) {
  const { isConnected, voiceUsers } = useSocket();
  const { user } = useAuth();

  const [isInVoice, setIsInVoice] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, PeerConnection>>(new Map());
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioLevelIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up peer connection
  const removePeer = useCallback((peerId: string) => {
    const peerConn = peersRef.current.get(peerId);
    if (peerConn) {
      peerConn.peer.destroy();
      peersRef.current.delete(peerId);
    }

    const audioEl = audioElementsRef.current.get(peerId);
    if (audioEl) {
      audioEl.srcObject = null;
      audioEl.remove();
      audioElementsRef.current.delete(peerId);
    }
  }, []);

  // Create a new peer connection
  const createPeer = useCallback(
    (targetUserId: string, initiator: boolean): SimplePeer.Instance => {
      const peer = new SimplePeer({
        initiator,
        trickle: true,
        stream: localStreamRef.current || undefined,
        config: { iceServers: ICE_SERVERS },
      });

      const socket = getSocket();

      peer.on('signal', (signal) => {
        if (!socket || !boardId) return;

        if (signal.type === 'offer') {
          socket.emit('voice_offer', {
            boardId,
            targetUserId,
            offer: signal,
          });
        } else if (signal.type === 'answer') {
          socket.emit('voice_answer', {
            boardId,
            targetUserId,
            answer: signal,
          });
        } else if ('candidate' in signal && signal.candidate) {
          socket.emit('voice_ice_candidate', {
            boardId,
            targetUserId,
            candidate: signal.candidate,
          });
        }
      });

      peer.on('stream', (stream) => {
        // Create audio element for remote stream
        let audioEl = audioElementsRef.current.get(targetUserId);
        if (!audioEl) {
          audioEl = document.createElement('audio');
          audioEl.autoplay = true;
          audioEl.id = `voice-audio-${targetUserId}`;
          document.body.appendChild(audioEl);
          audioElementsRef.current.set(targetUserId, audioEl);
        }
        audioEl.srcObject = stream;
      });

      peer.on('error', (err) => {
        console.error(`Peer error with ${targetUserId}:`, err);
        removePeer(targetUserId);
      });

      peer.on('close', () => {
        removePeer(targetUserId);
      });

      peersRef.current.set(targetUserId, { peerId: targetUserId, peer });

      return peer;
    },
    [boardId, removePeer]
  );

  // Handle incoming voice events
  useEffect(() => {
    if (!boardId || !isConnected || !isInVoice) return;

    const socket = getSocket();
    if (!socket) return;

    // When a new user joins voice, initiate connection to them
    const handleVoiceUserJoined = (data: { userId: string }) => {
      if (data.userId === user?.id) return;
      // We are already in voice, so we initiate the connection
      createPeer(data.userId, true);
    };

    // When a user leaves voice
    const handleVoiceUserLeft = (data: { userId: string }) => {
      removePeer(data.userId);
    };

    // List of existing voice users (we need to connect to them)
    const handleVoiceUsers = (data: { userIds: string[] }) => {
      // Connect to each existing user (they will send us offers)
      // We just prepare, actual connection happens when we receive offers
    };

    // Receive offer from another user
    const handleVoiceOffer = (data: VoiceOfferEvent) => {
      if (data.boardId !== boardId) return;

      // Check if we already have a peer for this user
      let peerConn = peersRef.current.get(data.fromUserId);
      if (!peerConn) {
        // Create non-initiator peer
        const peer = createPeer(data.fromUserId, false);
        peerConn = { peerId: data.fromUserId, peer };
      }

      peerConn.peer.signal(data.offer);
    };

    // Receive answer from another user
    const handleVoiceAnswer = (data: VoiceAnswerEvent) => {
      if (data.boardId !== boardId) return;

      const peerConn = peersRef.current.get(data.fromUserId);
      if (peerConn) {
        peerConn.peer.signal(data.answer);
      }
    };

    // Receive ICE candidate from another user
    const handleVoiceIceCandidate = (data: VoiceIceCandidateEvent) => {
      if (data.boardId !== boardId) return;

      const peerConn = peersRef.current.get(data.fromUserId);
      if (peerConn) {
        peerConn.peer.signal({ candidate: data.candidate } as SimplePeer.SignalData);
      }
    };

    socket.on('voice_user_joined', handleVoiceUserJoined);
    socket.on('voice_user_left', handleVoiceUserLeft);
    socket.on('voice_users', handleVoiceUsers);
    socket.on('voice_offer', handleVoiceOffer);
    socket.on('voice_answer', handleVoiceAnswer);
    socket.on('voice_ice_candidate', handleVoiceIceCandidate);

    return () => {
      socket.off('voice_user_joined', handleVoiceUserJoined);
      socket.off('voice_user_left', handleVoiceUserLeft);
      socket.off('voice_users', handleVoiceUsers);
      socket.off('voice_offer', handleVoiceOffer);
      socket.off('voice_answer', handleVoiceAnswer);
      socket.off('voice_ice_candidate', handleVoiceIceCandidate);
    };
  }, [boardId, isConnected, isInVoice, user?.id, createPeer, removePeer]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Setup audio level detection
  const setupAudioLevelDetection = useCallback((stream: MediaStream) => {
    try {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);

      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      microphone.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      // Emit audio level periodically
      audioLevelIntervalRef.current = setInterval(() => {
        if (!analyserRef.current || isMuted) {
          setAudioLevel(0);
          return;
        }

        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate average volume (0-255) and normalize to 0-1
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        const normalizedLevel = Math.min(average / 128, 1); // Normalize and cap at 1

        setAudioLevel(normalizedLevel);

        // Emit to socket if speaking (level > threshold)
        const socket = getSocket();
        if (socket && boardId && normalizedLevel > 0.05) {
          if (USE_PROTOBUF) {
            socket.emit('audio_level:bin', createAudioLevel(boardId, normalizedLevel));
          } else {
            socket.emit('voice_audio_level', { boardId, level: normalizedLevel });
          }
        }
      }, 50); // Update 20 times per second
    } catch (err) {
      console.error('Failed to setup audio level detection:', err);
    }
  }, [boardId, isMuted]);

  // Join voice chat
  const joinVoice = useCallback(async () => {
    if (!boardId || !isConnected) return;

    setIsLoading(true);
    setError(null);

    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      localStreamRef.current = stream;
      setIsInVoice(true);

      // Setup audio level detection
      setupAudioLevelDetection(stream);

      // Emit voice join event
      const socket = getSocket();
      if (socket) {
        socket.emit('voice_join', { boardId });
      }
    } catch (err: unknown) {
      console.error('Failed to get microphone access:', err);
      if (err instanceof Error && err.name === 'NotAllowedError') {
        setError('Microphone access denied');
      } else if (err instanceof Error && err.name === 'NotFoundError') {
        setError('No microphone found');
      } else {
        setError('Failed to access microphone');
      }
    } finally {
      setIsLoading(false);
    }
  }, [boardId, isConnected, setupAudioLevelDetection]);

  // Leave voice chat
  const leaveVoice = useCallback(() => {
    if (!boardId) return;

    // Stop audio level detection
    if (audioLevelIntervalRef.current) {
      clearInterval(audioLevelIntervalRef.current);
      audioLevelIntervalRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setAudioLevel(0);

    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    // Close all peer connections
    peersRef.current.forEach((_, peerId) => {
      removePeer(peerId);
    });
    peersRef.current.clear();

    // Emit voice leave event
    const socket = getSocket();
    if (socket) {
      socket.emit('voice_leave', { boardId });
    }

    setIsInVoice(false);
    setIsMuted(false);
  }, [boardId, removePeer]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (audioLevelIntervalRef.current) {
        clearInterval(audioLevelIntervalRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      const peers = peersRef.current;
      peers.forEach((_, peerId) => {
        removePeer(peerId);
      });
    };
  }, [removePeer]);

  // Other users in voice (excluding self)
  const voiceParticipants = voiceUsers.filter((id) => id !== user?.id);

  return {
    isInVoice,
    isMuted,
    isLoading,
    error,
    audioLevel,
    voiceUsers,
    voiceParticipants,
    joinVoice,
    leaveVoice,
    toggleMute,
    clearError,
  };
}
