import { useState, useEffect, useRef } from 'react';
import { Heart, Share2, Play, Pause, Volume2, VolumeX } from 'lucide-react';

const REEL_VIDEOS = [
    {
        id: '1',
        youtubeId: 'GZ6r_qNDXuY',
        title: 'Veg Daal ASMR Cooking 🍛',
        channel: 'IndianASMR',
        likes: '45K'
    },
    {
        id: '2',
        youtubeId: 'Hm040goA_pW',
        title: 'Peri Peri Chicken Prep 🍗',
        channel: 'SpiceMaster',
        likes: '32K'
    },
    {
        id: '3',
        youtubeId: 'Eplga_RY6Ne',
        title: '5-Minute Breakfast Prep 🍳',
        channel: 'QuickBites',
        likes: '89K'
    },
    {
        id: '4',
        youtubeId: 'HFf9bxZO4j1',
        title: 'Anda Tawa Fry Street Food 🥚',
        channel: 'StreetEats',
        likes: '120K'
    },
    {
        id: '5',
        youtubeId: 'E9Kg0BDr-cT',
        title: 'Chocolate Satisfying 🍫',
        channel: 'ChocoLover',
        likes: '200K'
    }
];

function VideoReel({ video, isActive }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const iframeRef = useRef(null);

    useEffect(() => {
        // Pause video when scrolled out of view
        if (!isActive && isPlaying) {
            handlePlayPause();
        }
    }, [isActive]);

    const handlePlayPause = () => {
        if (iframeRef.current) {
            const action = isPlaying ? 'pauseVideo' : 'playVideo';
            iframeRef.current.contentWindow.postMessage(JSON.stringify({
                event: 'command',
                func: action,
                args: []
            }), '*');
            setIsPlaying(!isPlaying);
        }
    };

    const handleMuteToggle = (e) => {
        e.stopPropagation();
        if (iframeRef.current) {
            const action = isMuted ? 'unMute' : 'mute';
            iframeRef.current.contentWindow.postMessage(JSON.stringify({
                event: 'command',
                func: action,
                args: []
            }), '*');
            setIsMuted(!isMuted);
        }
    };

    return (
        <div className="h-[calc(100vh-4rem)] w-full flex justify-center bg-black snap-start shrink-0 relative">
            <div className="relative h-full w-full max-w-[400px] bg-black">
                {/* Custom Overlay for Click to Play/Pause */}
                <div
                    className="absolute inset-0 z-10 cursor-pointer"
                    onClick={handlePlayPause}
                >
                    {/* Play/Pause Icon Animation */}
                    <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/40 rounded-full p-4 transition-opacity duration-300 ${isPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}>
                        {isPlaying ? (
                            <Pause className="w-8 h-8 text-white fill-current" />
                        ) : (
                            <Play className="w-8 h-8 text-white fill-current ml-1" />
                        )}
                    </div>
                </div>

                {/* Video Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black/80 to-transparent text-white">
                    <div className="flex justify-between items-end">
                        <div className="flex-1 mr-4">
                            <div className="flex items-center mb-2">
                                <div className="w-8 h-8 bg-gray-200 rounded-full mr-2"></div>
                                <span className="font-semibold text-sm">{video.channel}</span>
                            </div>
                            <p className="text-sm line-clamp-2 mb-2">{video.title}</p>
                            <div className="flex items-center text-xs opacity-80">
                                <span>ORIGINAL AUDIO</span>
                            </div>
                        </div>

                        {/* Right Action Buttons */}
                        <div className="flex flex-col items-center space-y-4 mb-2">
                            <button className="flex flex-col items-center space-y-1">
                                <Heart className="w-7 h-7" />
                                <span className="text-xs">{video.likes}</span>
                            </button>
                            <button className="flex flex-col items-center space-y-1">
                                <Share2 className="w-7 h-7" />
                                <span className="text-xs">Share</span>
                            </button>
                            <button onClick={handleMuteToggle} className="flex flex-col items-center space-y-1">
                                {isMuted ? <VolumeX className="w-7 h-7" /> : <Volume2 className="w-7 h-7" />}
                                <span className="text-xs">{isMuted ? 'Unmute' : 'Mute'}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* YouTube Iframe */}
                <iframe
                    ref={iframeRef}
                    className="w-full h-full object-cover pointer-events-none"
                    src={`https://www.youtube.com/embed/${video.youtubeId}?enablejsapi=1&controls=0&rel=0&loop=1&playlist=${video.youtubeId}&modestbranding=1&showinfo=0&iv_load_policy=3`}
                    title={video.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ pointerEvents: 'none' }} // Ensure clicks populate to overlay
                />
            </div>
        </div>
    );
}

export default function ShortVideos() {
    return (
        <div className="bg-black h-[calc(100vh-4rem)] w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth no-scrollbar">
            {REEL_VIDEOS.map((video, index) => (
                <VideoReel key={video.id} video={video} />
            ))}
        </div>
    );
}
