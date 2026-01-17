
import React, { useState, useMemo } from 'react';
import { ClosetItem, Category, CustomAttribute } from '../types';
import { X, Palette, Calendar, Sparkles, Check, Plus, Trash2, Loader2 } from 'lucide-react';

interface ClosetProps {
  items: ClosetItem[];
  onUpdateItem: (item: ClosetItem) => void;
  onDeleteItem: (id: string) => void;
  onAddToTryOn: (item: ClosetItem) => void;
}

const CircularProgress: React.FC<{ progress: number }> = ({ progress }) => {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg className="w-16 h-16 transform -rotate-90">
        <circle
          cx="32"
          cy="32"
          r={radius}
          stroke="currentColor"
          strokeWidth="4"
          fill="transparent"
          className="text-white/20"
        />
        <circle
          cx="32"
          cy="32"
          r={radius}
          stroke="currentColor"
          strokeWidth="4"
          fill="transparent"
          strokeDasharray={circumference}
          style={{ strokeDashoffset: offset }}
          className="text-[#fde18b] transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[10px] font-black text-[#fde18b] leading-none">{Math.round(progress)}%</span>
      </div>
    </div>
  );
};

const Closet: React.FC<ClosetProps> = ({ items, onUpdateItem, onDeleteItem, onAddToTryOn }) => {
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [viewingItem, setViewingItem] = useState<ClosetItem | null>(null);
  const [editedItem, setEditedItem] = useState<ClosetItem | null>(null);

  const categories = ['All', ...Object.values(Category)];
  
  const allTagsWithCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    items.forEach(item => {
      item.tags.forEach(tag => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    return Object.entries(counts).map(([tag, count]) => ({ tag, count }));
  }, [items]);

  const filteredItems = items.filter(item => {
    const categoryMatch = selectedCategory === 'All' || item.category === selectedCategory;
    const tagMatch = !selectedTag || item.tags.includes(selectedTag);
    return categoryMatch && tagMatch;
  });

  const getCategoryCount = (cat: string) => {
    if (cat === 'All') return items.length;
    return items.filter(i => i.category === cat).length;
  };

  const handleOpenDetail = (item: ClosetItem) => {
    if (item.isProcessing) return; // Prevent opening while processing
    setViewingItem(item);
    setEditedItem({ 
      ...item, 
      customAttributes: item.customAttributes || [] 
    });
  };

  const handleSaveAndClose = () => {
    if (editedItem) {
      onUpdateItem(editedItem);
      setViewingItem(null);
    }
  };

  const handleDelete = () => {
    if (viewingItem && confirm("Are you sure you want to delete this item?")) {
      onDeleteItem(viewingItem.id);
      setViewingItem(null);
    }
  };

  const handleQuickDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Delete this item?")) {
      onDeleteItem(id);
    }
  };

  const addAttribute = () => {
    if (!editedItem) return;
    const updatedAttrs = [...(editedItem.customAttributes || []), { label: 'Material', value: 'Cotton' }];
    setEditedItem({ ...editedItem, customAttributes: updatedAttrs });
  };

  const updateAttribute = (index: number, field: keyof CustomAttribute, value: string) => {
    if (!editedItem || !editedItem.customAttributes) return;
    const updatedAttrs = [...editedItem.customAttributes];
    updatedAttrs[index] = { ...updatedAttrs[index], [field]: value };
    setEditedItem({ ...editedItem, customAttributes: updatedAttrs });
  };

  const removeAttribute = (index: number) => {
    if (!editedItem || !editedItem.customAttributes) return;
    const updatedAttrs = editedItem.customAttributes.filter((_, i) => i !== index);
    setEditedItem({ ...editedItem, customAttributes: updatedAttrs });
  };

  return (
    <div className="flex flex-col animate-in fade-in duration-500">
      {/* Category Tabs */}
      <div className="flex space-x-3 px-5 py-4 overflow-x-auto no-scrollbar scroll-smooth">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat as Category | 'All')}
            className={`px-6 py-2.5 rounded-2xl text-[15px] font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat 
                ? 'bg-[#fde18b] text-[#1a1a1a] shadow-sm' 
                : 'bg-[#f5f5f5] text-[#757575] hover:bg-gray-200'
            }`}
          >
            {cat} <span className="ml-1 opacity-60 text-[12px]">{getCategoryCount(cat)}</span>
          </button>
        ))}
      </div>

      {/* Tags Carousel */}
      <div className="flex space-x-2 px-5 pb-5 overflow-x-auto no-scrollbar scroll-smooth">
        {allTagsWithCounts.map(({ tag, count }) => (
          <button
            key={tag}
            onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
            className={`px-3 py-1.5 rounded-xl text-[13px] font-medium border transition-all flex items-center space-x-1 whitespace-nowrap ${
              selectedTag === tag 
                ? 'bg-gray-800 text-white border-gray-800' 
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
            }`}
          >
            <span>{tag}</span>
            <span className="opacity-60 text-[11px]">({count})</span>
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="px-5 grid grid-cols-3 gap-3 pb-20">
        {filteredItems.map(item => (
          <div 
            key={item.id} 
            onClick={() => handleOpenDetail(item)}
            className="bg-white rounded-[24px] p-2 shadow-sm border border-gray-100 overflow-hidden relative group cursor-pointer transition-all hover:shadow-md active:scale-95"
          >
            <div className={`w-full h-full aspect-[4/5] bg-[#fdfdfd] rounded-[18px] flex items-center justify-center overflow-hidden relative ${item.isProcessing ? 'opacity-40' : ''}`}>
               <img 
                src={item.imageUrl} 
                alt={item.name} 
                className={`w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-500 ${!item.isProcessing ? 'drop-shadow-[0_8px_16px_rgba(0,0,0,0.06)]' : 'blur-[2px] contrast-75'}`}
              />
              
              {/* Quick Delete Button - Top Right on Hover */}
              {!item.isProcessing && (
                <button
                  onClick={(e) => handleQuickDelete(e, item.id)}
                  className="absolute top-2 right-2 p-1.5 bg-red-500/90 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-90 shadow-lg z-10"
                >
                  <Trash2 size={12} strokeWidth={3} />
                </button>
              )}

              {/* Bottom Label Pill */}
              <div className="absolute bottom-1.5 left-1.5 right-1.5">
                <div className="bg-white/95 backdrop-blur-sm rounded-[10px] px-2 py-1 shadow-sm border border-gray-50/50">
                  <p className="text-[9px] text-[#1e293b] font-black truncate leading-none text-center">{item.name}</p>
                </div>
              </div>

              {/* Enhanced Processing UI with Progress Bar */}
              {item.isProcessing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 backdrop-blur-[1px]">
                   <div className="bg-white/90 rounded-3xl p-3 shadow-xl flex flex-col items-center space-y-2 animate-in zoom-in-75 duration-300">
                      <CircularProgress progress={item.processingProgress || 0} />
                      <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest text-center">Processing...</span>
                   </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Item Detail Modal */}
      {viewingItem && editedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setViewingItem(null)}
          />
          
          <div className="w-[88vw] max-w-[380px] bg-white rounded-[44px] p-6 relative z-10 animate-in zoom-in-95 duration-300 shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
            <button 
              onClick={() => setViewingItem(null)}
              className="absolute top-6 right-6 p-1 text-gray-400 hover:text-gray-600 transition-colors z-20"
            >
              <X size={24} strokeWidth={2.5} />
            </button>

            <div className="w-full flex space-x-5 mb-5 overflow-hidden flex-shrink-0">
              <div className="w-32 h-32 bg-[#fdfdfd] rounded-[32px] flex items-center justify-center p-4 border border-gray-100 shadow-inner overflow-hidden flex-shrink-0">
                 <img src={viewingItem.imageUrl} alt="" className="w-full h-full object-contain drop-shadow-xl scale-110" />
              </div>
              
              <div className="flex-1 flex flex-col justify-center">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.15em] mb-1">Item Name</p>
                <textarea 
                  className="text-lg font-extrabold w-full focus:outline-none bg-transparent leading-[1.2] text-gray-800 resize-none no-scrollbar h-auto max-h-[60px]"
                  value={editedItem.name}
                  onChange={(e) => setEditedItem({ ...editedItem, name: e.target.value })}
                  placeholder="Enter name..."
                  rows={2}
                />
                <div className="mt-2 flex items-center space-x-1 opacity-40">
                   <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                   <span className="text-[10px] font-bold uppercase">{viewingItem.category}</span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar px-1 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#f9f9f9] rounded-[22px] p-4 flex items-center space-x-3">
                  <Palette size={18} className="text-[#b0b0b0]" />
                  <div className="flex-1 overflow-hidden">
                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Color</p>
                    <input 
                      className="text-[13px] font-bold text-gray-800 bg-transparent focus:outline-none w-full truncate"
                      value={editedItem.color}
                      onChange={(e) => setEditedItem({ ...editedItem, color: e.target.value })}
                    />
                  </div>
                </div>

                <div className="bg-[#f9f9f9] rounded-[22px] p-4 flex items-center space-x-3">
                  <Calendar size={18} className="text-[#b0b0b0]" />
                  <div className="flex-1 overflow-hidden">
                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Season</p>
                    <input 
                      className="text-[13px] font-bold text-gray-800 bg-transparent focus:outline-none w-full truncate"
                      value={editedItem.season}
                      onChange={(e) => setEditedItem({ ...editedItem, season: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-[#eff4ff] rounded-[42px] p-6 border border-[#e1e8ff]">
                <div className="flex items-center space-x-3 mb-3">
                  <Sparkles size={18} fill="#4c51bf" className="text-[#4c51bf]" />
                  <p className="text-[11px] font-black text-[#3e4784] uppercase tracking-[0.12em]">Gemini Suggestion</p>
                </div>
                <p className="text-[14px] text-[#2d3748] font-medium leading-[1.5] italic">
                  "{viewingItem.suggestion || 'Pair with contrast basics for a modern, high-fashion silhouette.'}"
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Properties</p>
                  <button onClick={addAttribute} className="text-[#e8b628] hover:text-[#d4a520] transition-colors">
                    <Plus size={16} strokeWidth={3} />
                  </button>
                </div>
                {editedItem.customAttributes?.map((attr, idx) => (
                  <div key={idx} className="flex items-center space-x-3 bg-white border border-gray-100 rounded-2xl p-3 shadow-sm">
                    <input 
                      className="w-20 text-[11px] font-bold text-gray-400 uppercase bg-transparent focus:outline-none"
                      value={attr.label}
                      onChange={(e) => updateAttribute(idx, 'label', e.target.value)}
                    />
                    <div className="h-4 w-[1px] bg-gray-100" />
                    <input 
                      className="flex-1 text-[13px] font-bold text-gray-800 bg-transparent focus:outline-none"
                      value={attr.value}
                      onChange={(e) => updateAttribute(idx, 'value', e.target.value)}
                    />
                    <button onClick={() => removeAttribute(idx)} className="text-gray-300 hover:text-red-400 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 mt-2 border-t border-gray-50 flex space-x-3 flex-shrink-0">
              <button 
                onClick={handleDelete}
                className="w-14 h-14 bg-red-50 text-red-500 rounded-[20px] flex items-center justify-center shadow-sm active:scale-95 transition-all"
                title="Delete Item"
              >
                <Trash2 size={20} />
              </button>
              <button 
                onClick={() => onAddToTryOn(viewingItem)}
                className="flex-1 h-14 bg-[#fde18b] text-[#1a1a1a] rounded-[20px] font-bold text-[14px] flex items-center justify-center space-x-2 shadow-sm active:scale-95 transition-all"
              >
                <Sparkles size={18} fill="currentColor" />
                <span>Try On</span>
              </button>
              <button 
                onClick={handleSaveAndClose}
                className="w-14 h-14 bg-gray-800 text-white rounded-[20px] flex items-center justify-center shadow-sm active:scale-95 transition-all"
              >
                <Check size={20} strokeWidth={3} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Closet;
