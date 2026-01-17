
import React, { useState, useRef } from 'react';
import { ClosetItem, BodyMetrics, Category, Outfit } from '../types';
import ThreeScene from './ThreeScene';
import { analyzeBodyMetrics } from '../services/gemini';

interface TryOnSectionProps {
  closet: ClosetItem[];
  metrics: BodyMetrics;
  setMetrics: (m: BodyMetrics) => void;
  onSaveOutfit: (o: Outfit) => void;
}

const TryOnSection: React.FC<TryOnSectionProps> = ({ closet, metrics, setMetrics, onSaveOutfit }) => {
  const [equippedItems, setEquippedItems] = useState<ClosetItem[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleEquip = (item: ClosetItem) => {
    setEquippedItems(prev => {
      // Logic: Only one item per category usually, except accessories
      const sameCategory = prev.find(i => i.category === item.category);
      if (sameCategory?.id === item.id) {
        return prev.filter(i => i.id !== item.id);
      }
      return [...prev.filter(i => i.category !== item.category), item];
    });
  };

  const handleBodyPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = (event.target?.result as string).split(',')[1];
        const newMetrics = await analyzeBodyMetrics(base64);
        setMetrics(newMetrics);
        setIsAnalyzing(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      alert("Failed to analyze body metrics.");
      setIsAnalyzing(false);
    }
  };

  const handleSave = () => {
    if (equippedItems.length === 0) return;
    const outfit: Outfit = {
      id: Date.now().toString(),
      name: `Style ${new Date().toLocaleDateString()}`,
      items: equippedItems,
      createdAt: Date.now()
    };
    onSaveOutfit(outfit);
    alert("Outfit saved to gallery!");
  };

  return (
    <div className="flex flex-col h-full">
      {/* 3D Viewer */}
      <div className="relative p-4">
        <ThreeScene metrics={metrics} equippedItems={equippedItems} />
        
        {/* Action Overlay */}
        <div className="absolute top-8 right-8 flex flex-col gap-2">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-10 h-10 bg-white shadow-md rounded-full flex items-center justify-center text-amber-500 hover:bg-amber-50 transition-colors"
            title="Calibrate Body Metrics"
          >
            {isAnalyzing ? (
               <i className="fa-solid fa-spinner fa-spin"></i>
            ) : (
               <i className="fa-solid fa-person-rays"></i>
            )}
          </button>
          <button 
            onClick={handleSave}
            className="w-10 h-10 bg-amber-400 shadow-md rounded-full flex items-center justify-center text-white hover:bg-amber-500 transition-colors"
            title="Save Outfit"
          >
            <i className="fa-solid fa-bookmark"></i>
          </button>
        </div>
        <input type="file" className="hidden" ref={fileInputRef} onChange={handleBodyPhotoUpload} accept="image/*" />
      </div>

      {/* Wardrobe Scroll */}
      <div className="flex-1 bg-gray-50/50 p-4 border-t border-gray-100">
        <div className="mb-3 flex justify-between items-end">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-tight">Your Pieces</h3>
          <span className="text-[10px] font-medium text-gray-400">TAP TO WEAR</span>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
          {closet.map(item => {
            const isEquipped = equippedItems.some(ei => ei.id === item.id);
            return (
              <div 
                key={item.id}
                onClick={() => toggleEquip(item)}
                className={`flex-shrink-0 w-24 aspect-square rounded-2xl flex items-center justify-center p-2 cursor-pointer transition-all border-2 ${
                  isEquipped 
                  ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/20' 
                  : 'bg-white border-transparent shadow-sm hover:border-gray-200'
                }`}
              >
                <img src={item.imageUrl} className="max-w-full max-h-full object-contain" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TryOnSection;
