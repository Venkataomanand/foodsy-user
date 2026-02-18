import { useState } from 'react';
import { Heart, Share2, Play } from 'lucide-react';

export default function ShortVideos() {
    // Sample food ASMR/Shorts video IDs
    // In a real app, these would come from a backend or API
    const videos = [
        {
            id: '1',
            youtubeId: 'tgbNymZ7vqY', // Example ID - replace with real Shorts IDs
            title: 'Satisfying Crispy Fried Chicken ASMR 🍗',
            channel: 'CrunchyEats',
            likes: '12.5K'
        },
        {
            id: '2',
            youtubeId: '7T2R_Sj9z0k',
            title: 'Making the Perfect Burger 🍔',
            channel: 'BurgerKing 👑',
            likes: '8.2K'
        },
        {
            id: '3',
            youtubeId: 'LXb3EKWsInQ',
            title: 'Rainbow Cake Decorating 🎂',
            channel: 'SweetTreats',
            likes: '45K'
        },
        {
            id: '4',
            youtubeId: 'C8h7w6n5m4l',
            title: 'Spicy Noodles Challenge 🌶️',
            channel: 'SpicyLife',
            likes: '22K'
        },
        {
            id: '5',
            youtubeId: 'A1B2C3D4E5F',
            title: 'Japanese Street Food - Takoyaki 🐙',
            channel: 'StreetFoodWorld',
            likes: '15K'
        },
        {
            id: '6',
            youtubeId: 'G6H7I8J9K0L',
            title: 'Fresh Fruit Salad Carving 🍉',
            channel: 'FruitArt',
            likes: '9.8K'
        }
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Food Reels & ASMR</h1>
                <p className="text-gray-600">Watch satisfying food videos while you wait for your order!</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {videos.map((video) => (
                    <div key={video.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col">
                        <div className="relative pt-[177.77%] bg-black"> {/* 9:16 Aspect Ratio */}
                            <iframe
                                className="absolute top-0 left-0 w-full h-full"
                                src={`https://www.youtube.com/embed/${video.youtubeId}?rel=0&modestbranding=1&loop=1&playlist=${video.youtubeId}`}
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
                            <div className="mt-4 flex items-center justify-between text-gray-500">
                                <button className="flex items-center space-x-1 hover:text-red-500 transition-colors">
                                    <Heart className="h-5 w-5" />
                                    <span className="text-xs">{video.likes}</span>
                                </button>
                                <button className="flex items-center space-x-1 hover:text-blue-500 transition-colors">
                                    <Share2 className="h-5 w-5" />
                                    <span className="text-xs">Share</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
