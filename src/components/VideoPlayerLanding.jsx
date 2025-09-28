import React, { useEffect, useRef } from 'react';

// YouTube IFrame API based landing video player that exposes window.landingMediaActions
// to allow GestureController to control play/pause and volume.
export default function VideoPlayerLanding({ videoId = 'xvFZjo5PgG0', playlistId = null, posterUrl }) {
  const playerRef = useRef(null);
  const containerId = 'landing-youtube-player';

  // Load YT IFrame API if needed and create player
  useEffect(() => {
    const ensureAPI = () => new Promise((resolve) => {
      if (window.YT && window.YT.Player) return resolve(window.YT);
      const prev = document.getElementById('yt-iframe-api');
      if (!prev) {
        const s = document.createElement('script');
        s.id = 'yt-iframe-api';
        s.src = 'https://www.youtube.com/iframe_api';
        document.body.appendChild(s);
      }
      const onReady = () => resolve(window.YT);
      window.onYouTubeIframeAPIReady = onReady;
      // If it was already loaded between, resolve on next tick
      if (window.YT && window.YT.Player) setTimeout(onReady, 0);
    });

    let player;
    let cancelled = false;
    ensureAPI().then((YT) => {
      if (cancelled) return;
      player = new YT.Player(containerId, {
        width: '100%',
        height: '100%',
        videoId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
          controls: 1,
          playsinline: 1,
          ...(playlistId ? { list: playlistId } : {}),
        },
        events: {
          onReady: () => {},
          onError: () => {},
        },
      });
      playerRef.current = player;

      // Expose landing media actions for gestures
      window.landingMediaActions = {
        toggleVideo: async () => {
          try {
            const st = player.getPlayerState();
            if (st !== window.YT.PlayerState.PLAYING) {
              player.playVideo();
            } else {
              player.pauseVideo();
            }
          } catch {
            // No-op if player not ready
          }
        },
        volumeUp: () => {
          try {
            const v = player.getVolume();
            player.setVolume(Math.min(100, v + 5));
          } catch {}
        },
        volumeDown: () => {
          try {
            const v = player.getVolume();
            player.setVolume(Math.max(0, v - 5));
          } catch {}
        },
      };
    });

    return () => {
      cancelled = true;
      try { if (playerRef.current && playerRef.current.destroy) playerRef.current.destroy(); } catch {}
      try { delete window.landingMediaActions; } catch {}
    };
  }, [videoId]);

  return (
    <div className="landing-video" style={{ position: 'relative', width: '100%', paddingTop: '56.25%' }}>
      <div id={containerId} style={{ position: 'absolute', inset: 0 }} />
    </div>
  );
}
