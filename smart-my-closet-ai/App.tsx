
import React, { useState, useEffect, useCallback } from 'react';
import { ClosetItem, Category, AppTab, BodyMetrics, Outfit } from './types';
import ClosetSection from './components/ClosetSection';
import TryOnSection from './components/TryOnSection';
import OutfitsSection from './components/OutfitsSection';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>('closet');
  const [closet, setCloset] = useState<ClosetItem[]>([
    {
      id: '1',
      category: Category.TOPS,
      tags: ['Summer', 'Beach'],
      color: 'white',
      imageUrl: 'https://picsum.photos/seed/tshirt/400/400'
    },
    {
      id: '2',
      category: Category.BOTTOMS,
      tags: ['Summer', 'Casual'],
      color: 'black',
      imageUrl: 'https://picsum.photos/seed/shorts/400/400'
    },
    {
       id: '3',
       category: Category.DRESSES,
       tags: ['Beach', 'Vacation'],
       color: 'blue',
       imageUrl: 'https://picsum.photos/seed/dress/400/400'
    }
  ]);

  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [metrics, setMetrics] = useState<BodyMetrics>({
    shoulderWidth: 1.0,
    waistWidth: 1.0,
    heightRatio: 1.0
  });

  const handleAddItem = (item: ClosetItem) => {
    setCloset(prev => [item, ...prev]);
  };

  const handleUpdateItem = (updatedItem: ClosetItem) => {
    setCloset(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
  };

  const handleDeleteItem = (itemId: string) => {
    setCloset(prev => prev.filter(item => item.id !== itemId));
  };

  const handleSaveOutfit = (outfit: Outfit) => {
    setOutfits(prev => [outfit, ...prev]);
  };

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col bg-white shadow-xl relative">
      {/* Header */}
      <header className="px-6 pt-8 pb-4 flex justify-between items-center bg-white sticky top-0 z-10 border-b border-gray-100">
        <h1 className="text-2xl font-bold tracking-tight text-gray-800">My Closet</h1>
        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
          <i className="fa-solid fa-bars-staggered text-gray-600"></i>
        </button>
      </header>

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto pb-24">
        {activeTab === 'closet' && (
          <ClosetSection 
            items={closet} 
            onAddItem={handleAddItem} 
            onUpdateItem={handleUpdateItem}
            onDeleteItem={handleDeleteItem}
          />
        )}
        {activeTab === 'try-on' && (
          <TryOnSection 
            closet={closet} 
            metrics={metrics} 
            setMetrics={setMetrics}
            onSaveOutfit={handleSaveOutfit}
          />
        )}
        {activeTab === 'outfits' && (
          <OutfitsSection 
            outfits={outfits} 
          />
        )}
        {activeTab === 'profile' && (
          <div className="p-10 text-center">
            <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
              <i className="fa-solid fa-user text-3xl text-gray-400"></i>
            </div>
            <h2 className="text-xl font-bold">User Profile</h2>
            <p className="text-gray-500">Settings and preferences</p>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100 px-4 py-3 flex justify-around items-center z-20 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <NavItem 
          active={activeTab === 'closet'} 
          icon="fa-door-closed" 
          label="Closet" 
          onClick={() => setActiveTab('closet')} 
        />
        <NavItem 
          active={activeTab === 'outfits'} 
          icon="fa-layer-group" 
          label="Outfits" 
          onClick={() => setActiveTab('outfits')} 
        />
        <NavItem 
          active={activeTab === 'try-on'} 
          icon="fa-wand-magic-sparkles" 
          label="Try-On" 
          onClick={() => setActiveTab('try-on')} 
        />
        <NavItem 
          active={activeTab === 'profile'} 
          icon="fa-circle-user" 
          label="Profile" 
          onClick={() => setActiveTab('profile')} 
        />
      </nav>
    </div>
  );
};

const NavItem: React.FC<{ active: boolean; icon: string; label: string; onClick: () => void }> = ({ active, icon, label, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-amber-500' : 'text-gray-400 hover:text-gray-600'}`}
  >
    <i className={`fa-solid ${icon} text-lg`}></i>
    <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
  </button>
);

export default App;
