import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { Heart, Play } from 'lucide-react';

export default function ShortVideos() {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchShorts();
    }, []);

    const fetchShorts = async () => {
        try {
            const q = query(collection(db, 'shorts'), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            const shortsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setVideos(shortsData);
        } catch (error) {
            console.error("Error fetching shorts:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading satisfying videos...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center">
                    <Play className="h-8 w-8 text-primary mr-2 fill-current" /> Foodsy Shorts
                </h1>
                <p className="text-gray-600">Enjoy satisfying food preparation and ASMR videos!</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {videos.map((video) => (
                    <div key={video.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col">
                        <div className="relative pt-[177.77%] bg-black"> {/* 9:16 Aspect Ratio */}
                            <iframe
                                className="absolute top-0 left-0 w-full h-full"
                                src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?rel=0&modestbranding=1&controls=1&showinfo=0`}
                                title={video.title}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                        <div className="p-4 flex-1 flex flex-col justify-between">
                            <div>
                                <h3 className="font-semibold text-gray-900 line-clamp-2">{video.title}</h3>
                                <p className="text-sm text-gray-500 mt-1">{video.channel}</p>
                            </div>
                            <div className="mt-4 flex items-center justify-start text-gray-500">
                                <button className="flex items-center space-x-1 hover:text-red-500 transition-colors">
                                    <Heart className="h-5 w-5" />
                                    <span className="text-xs">{video.likes}</span>
                                </button>
                                {/* Share button removed as requested */}
                            </div>
                        </div>
                    </div>
                ))}
                {videos.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-500">
                        No videos uploaded yet by Admin.
                    </div>
                )}
            </div>
        </div>
    );
}
