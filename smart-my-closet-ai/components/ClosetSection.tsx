
import React, { useState, useRef } from 'react';
import { ClosetItem, Category } from '../types';
import { removeBackground, analyzeClosetItem } from '../services/gemini';

interface ClosetSectionProps {
  items: ClosetItem[];
  onAddItem: (item: ClosetItem) => void;
  onUpdateItem: (item: ClosetItem) => void;
  onDeleteItem: (itemId: string) => void;
}

const ClosetSection: React.FC<ClosetSectionProps> = ({ items, onAddItem, onUpdateItem, onDeleteItem }) => {
  const [filter, setFilter] = useState<string>('All');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ClosetItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = ['All', ...Object.values(Category)];
  const filteredItems = filter === 'All' ? items : items.filter(i => i.category === filter);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = (event.target?.result as string).split(',')[1];
        
        const [transparentImg, metadata] = await Promise.all([
          removeBackground(base64),
          analyzeClosetItem(base64)
        ]);

        const newItem: ClosetItem = {
          id: Date.now().toString(),
          category: metadata.category as Category || Category.TOPS,
          tags: metadata.tags || [],
          color: metadata.color || 'white',
          imageUrl: transparentImg,
          originalImageUrl: event.target?.result as string
        };

        onAddItem(newItem);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      alert("Failed to process image. Make sure your API key is valid.");
      setIsUploading(false);
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* Category Filters */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-5 py-2 rounded-full whitespace-nowrap text-sm font-semibold transition-all shadow-sm ${
              filter === cat 
                ? 'bg-amber-400 text-white' 
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {cat} {cat === 'All' ? items.length : items.filter(i => i.category === cat).length}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-3">
        {filteredItems.map(item => (
          <div 
            key={item.id} 
            onClick={() => setSelectedItem(item)}
            className="aspect-square bg-gray-50 rounded-2xl p-3 flex items-center justify-center border border-gray-100 hover:shadow-md transition-shadow cursor-pointer relative group"
          >
            <img src={item.imageUrl} alt="item" className="max-w-full max-h-full object-contain" />
            <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
               <span className="text-[8px] bg-white/80 px-1 rounded border shadow-sm">
                {item.category}
               </span>
            </div>
          </div>
        ))}
        
        {isUploading && (
          <div className="aspect-square bg-gray-100 rounded-2xl flex flex-col items-center justify-center border border-gray-200 animate-pulse">
            <i className="fa-solid fa-spinner fa-spin text-amber-400 text-xl mb-2"></i>
            <span className="text-[10px] text-gray-500 font-medium">Processing...</span>
          </div>
        )}
      </div>

      {/* Floating Add Button */}
      <button 
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="fixed bottom-28 right-8 w-14 h-14 bg-amber-400 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-amber-500 transition-all hover:scale-110 active:scale-95 disabled:bg-gray-300 z-10"
      >
        <i className="fa-solid fa-plus text-xl"></i>
      </button>
      <input 
        type="file" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept="image/*" 
      />

      {/* Edit Modal */}
      {selectedItem && (
        <EditModal 
          item={selectedItem} 
          onClose={() => setSelectedItem(null)} 
          onSave={(updated) => {
            onUpdateItem(updated);
            setSelectedItem(null);
          }}
          onDelete={(id) => {
            onDeleteItem(id);
            setSelectedItem(null);
          }}
        />
      )}
    </div>
  );
};

interface EditModalProps {
  item: ClosetItem;
  onClose: () => void;
  onSave: (item: ClosetItem) => void;
  onDelete: (id: string) => void;
}

const EditModal: React.FC<EditModalProps> = ({ item, onClose, onSave, onDelete }) => {
  const [editedItem, setEditedItem] = useState<ClosetItem>({ ...item });
  const [tagsString, setTagsString] = useState(item.tags.join(', '));

  const handleSave = () => {
    const finalTags = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
    onSave({ ...editedItem, tags: finalTags });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm p-4 transition-all">
      <div className="w-full max-w-md bg-white rounded-t-[2.5rem] rounded-b-[1.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
        <div className="relative h-64 bg-gray-50 p-8 flex items-center justify-center">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors shadow-sm"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
          <img src={item.imageUrl} className="max-w-full max-h-full object-contain drop-shadow-xl" alt="Preview" />
        </div>
        
        <div className="p-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Category</label>
              <select 
                value={editedItem.category}
                onChange={(e) => setEditedItem({ ...editedItem, category: e.target.value as Category })}
                className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-400 outline-none transition-all"
              >
                {Object.values(Category).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Color</label>
                <input 
                  type="text"
                  value={editedItem.color}
                  onChange={(e) => setEditedItem({ ...editedItem, color: e.target.value })}
                  className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-400 outline-none transition-all"
                />
              </div>
              <div className="flex items-end pb-1 px-1">
                <div className="w-8 h-8 rounded-full border shadow-inner" style={{ backgroundColor: editedItem.color.toLowerCase() }} />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Tags (separated by comma)</label>
              <input 
                type="text"
                value={tagsString}
                onChange={(e) => setTagsString(e.target.value)}
                placeholder="e.g. Summer, Beach, Casual"
                className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-400 outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <button 
              onClick={handleSave}
              className="w-full bg-amber-400 text-white font-bold py-4 rounded-2xl shadow-lg shadow-amber-200 hover:bg-amber-500 transition-all active:scale-95"
            >
              Update Item
            </button>
            <button 
              onClick={() => {
                if(confirm("Are you sure you want to delete this item?")) {
                  onDelete(item.id);
                }
              }}
              className="w-full text-red-400 text-xs font-bold py-2 hover:text-red-600 transition-colors"
            >
              Delete Item from Closet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClosetSection;
