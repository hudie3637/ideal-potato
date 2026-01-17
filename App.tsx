
import React, { useState, useEffect, useRef } from 'react';
import { View, Category, ClosetItem, BodyParams, Outfit, UserProfile, CalendarMap, UserAccount } from './types';
import Closet from './components/Closet';
import CalendarView from './components/TryOn'; 
import Outfits from './components/Outfits';
import Discover from './components/Discover';
import { 
  ShoppingBag, 
  Calendar as CalendarIcon, 
  User as UserIcon, 
  Sparkles, 
  Plus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Camera,
  Trash2,
  Settings,
  Edit3,
  UserCheck,
  SlidersHorizontal,
  Clock,
  LogIn,
  ArrowRight,
  LogOut,
  Compass
} from 'lucide-react';
import { removeBackground, analyzeImageForItems } from './services/geminiService';
import { saveData, getData, deleteData } from './services/storageService';

const INITIAL_ITEMS: ClosetItem[] = [
  {
    id: '1',
    name: 'Yellow Owl Tee',
    category: Category.TOPS,
    tags: ['Summer 💛', 'Casual'],
    color: 'Yellow',
    season: 'Summer',
    suggestion: 'Pair with blue denim shorts or comfortable joggers.',
    imageUrl: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&q=80&w=400',
    originalImageUrl: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&q=80&w=400',
    isProcessing: false,
    processingProgress: 100
  }
];

// Helper to compress images before saving
const compressImage = (base64Str: string, maxWidth = 1024, quality = 0.8): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(base64Str);
  });
};

const App: React.FC = () => {
  const [isBooting, setIsBooting] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [loginInput, setLoginInput] = useState("");
  
  const [activeView, setActiveView] = useState<View>('Closet');
  const [items, setItems] = useState<ClosetItem[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [calendarMap, setCalendarMap] = useState<CalendarMap>({});
  const [userProfile, setUserProfile] = useState<UserProfile>({ 
    name: '',
    photoUrl: '',
    bodyPhotoUrl: ''
  });
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [toast, setToast] = useState<{ message: string, visible: boolean, type: 'success' | 'error' | 'warning' }>({ message: '', visible: false, type: 'success' });
  
  const isAiWorking = useRef(false);
  const nextAllowedRequestTime = useRef(0);
  const isHydrated = useRef(false);

  // Load current session on startup
  useEffect(() => {
    const bootApp = async () => {
      try {
        const savedUser = await getData('user_meta', 'current-session');
        if (savedUser && savedUser.username) {
          setCurrentUser(savedUser);
        }
      } catch (e) {
        console.error("Failed to load session", e);
      } finally {
        setTimeout(() => {
          setIsBooting(false);
          document.getElementById('splash-screen')?.classList.add('fade-out');
          document.body.classList.add('app-ready');
        }, 800);
      }
    };
    bootApp();
  }, []);

  // Load User-Specific Data
  useEffect(() => {
    if (!currentUser) {
      isHydrated.current = false;
      setItems([]);
      setOutfits([]);
      setCalendarMap({});
      setUserProfile({ name: '', photoUrl: '', bodyPhotoUrl: '' });
      return;
    }

    const userId = currentUser.username;
    isHydrated.current = false;

    const loadUserData = async () => {
      try {
        const savedItems = await getData('items', userId);
        setItems(Array.isArray(savedItems) ? savedItems : INITIAL_ITEMS);

        const savedOutfits = await getData('outfits', userId);
        setOutfits(Array.isArray(savedOutfits) ? savedOutfits : []);

        const savedCalendar = await getData('calendar', userId);
        setCalendarMap(savedCalendar && typeof savedCalendar === 'object' ? savedCalendar : {});

        const savedProfile = await getData('profile', userId);
        if (savedProfile) {
          setUserProfile(savedProfile);
        } else {
          setUserProfile({ name: currentUser.username, photoUrl: '', bodyPhotoUrl: '' });
        }
        
        setTimeout(() => {
          isHydrated.current = true;
          setItems(prev => [...prev]);
        }, 50);
      } catch (e) {
        console.error("IndexedDB Load error:", e);
        setItems(INITIAL_ITEMS);
        isHydrated.current = true;
      }
    };
    loadUserData();
  }, [currentUser]);

  // Persist Data to IndexedDB
  useEffect(() => {
    if (isBooting || !currentUser || !isHydrated.current) return;
    
    const persist = async () => {
      try {
        const userId = currentUser.username;
        await saveData('items', userId, items);
        await saveData('outfits', userId, outfits);
        await saveData('calendar', userId, calendarMap);
        await saveData('profile', userId, userProfile);
        await saveData('user_meta', 'current-session', currentUser);
      } catch (e) {
        console.error("IndexedDB Save error:", e);
        showToast("Storage error! Your device might be out of space.", "error");
      }
    };
    persist();
  }, [items, outfits, calendarMap, userProfile, isBooting, currentUser]);

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!loginInput.trim()) return;
    const username = loginInput.trim();
    const newUser = { id: `u-${Date.now()}`, username };
    setCurrentUser(newUser);
    showToast(`Welcome, ${username}!`);
  };

  const handleLogout = async () => {
    if (confirm("Logout?")) {
      isHydrated.current = false;
      await deleteData('user_meta', 'current-session');
      setCurrentUser(null);
      setLoginInput("");
    }
  };

  // Background AI processes (background removal)
  useEffect(() => {
    if (isBooting || !currentUser || !isHydrated.current || isAiWorking.current) return;
    const processQueue = async () => {
      const itemToProcess = items.find(i => i.isProcessing && (i.processingProgress || 0) < 100);
      if (!itemToProcess) return;
      if (Date.now() < nextAllowedRequestTime.current) return; 
      isAiWorking.current = true;
      try {
        setItems(prev => prev.map(i => i.id === itemToProcess.id ? { ...i, processingProgress: 20 } : i));
        const cleanedUrl = await removeBackground(itemToProcess.originalImageUrl, itemToProcess.name);
        setItems(prev => prev.map(i => i.id === itemToProcess.id ? { ...i, imageUrl: cleanedUrl, isProcessing: false, processingProgress: 100 } : i));
        nextAllowedRequestTime.current = Date.now() + 5000; 
      } catch (error) {
        setItems(prev => prev.map(i => i.id === itemToProcess.id ? { ...i, isProcessing: false, processingProgress: 100 } : i));
      } finally {
        isAiWorking.current = false;
      }
    };
    const timer = setInterval(processQueue, 3000);
    return () => clearInterval(timer);
  }, [items, isBooting, currentUser]);

  const showToast = (msg: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ message: msg, visible: true, type });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 4000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setUploadStatus("AI Analyzing...");
    const reader = new FileReader();
    reader.onloadend = async () => {
      const rawBase64 = reader.result as string;
      // Compress the original image immediately to save storage
      const compressedBase64 = await compressImage(rawBase64, 1024, 0.7);
      
      try {
        const detectedInfos = await analyzeImageForItems(compressedBase64);
        const newItems: ClosetItem[] = detectedInfos.map((info, i) => ({
          id: `item-${Date.now()}-${i}`,
          name: info.name,
          category: info.category as Category,
          tags: info.tags,
          color: info.color,
          season: info.season,
          suggestion: info.suggestion,
          imageUrl: compressedBase64,
          originalImageUrl: compressedBase64,
          isProcessing: true,
          processingProgress: 10
        }));
        setItems(prev => [...newItems, ...prev]);
        showToast(`AI Identified ${newItems.length} items.`);
      } catch (err) {
        showToast("AI Analysis failed.", 'error');
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
    showToast("Item deleted");
  };

  const handleSaveOutfit = (outfit: Outfit) => {
    setOutfits(prev => [outfit, ...prev]);
    showToast("Outfit saved!");
  };

  if (isBooting) return null;

  if (!currentUser) {
    return (
      <div className="flex flex-col h-screen max-w-md mx-auto bg-white shadow-2xl relative overflow-hidden font-['Inter']">
        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-12">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-[#fde18b] rounded-[32px] flex items-center justify-center mx-auto shadow-2xl shadow-yellow-100 animate-bounce-slow">
              <ShoppingBag size={40} className="text-gray-900" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-gray-900">Welcome</h1>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">Smart AI Wardrobe</p>
            </div>
          </div>
          <form onSubmit={handleLogin} className="w-full space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Account Name</label>
              <div className="relative">
                <input type="text" value={loginInput} onChange={(e) => setLoginInput(e.target.value)} placeholder="Fashion ID..." className="w-full h-16 bg-gray-50 border-2 border-transparent focus:border-[#fde18b] focus:bg-white rounded-[24px] px-6 font-bold text-gray-800 transition-all outline-none" />
                <button type="submit" disabled={!loginInput.trim()} className="absolute right-3 top-3 w-10 h-10 bg-gray-900 text-[#fde18b] rounded-2xl flex items-center justify-center disabled:opacity-30 transition-all active:scale-90"><ArrowRight size={20} /></button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  const NavButton = ({ view, icon: Icon, label }: { view: View, icon: any, label: string }) => (
    <button onClick={() => setActiveView(view)} className={`flex flex-col items-center justify-center space-y-1 transition-all flex-1 relative ${activeView === view ? 'text-[#333]' : 'text-[#9e9e9e]'}`}>
      <Icon size={24} className={activeView === view ? 'fill-current scale-110' : 'scale-100'} />
      <span className="text-[11px] font-medium">{label}</span>
      {activeView === view && <div className="absolute -bottom-2 w-1.5 h-1.5 bg-[#fde18b] rounded-full" />}
    </button>
  );

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-white shadow-2xl relative overflow-hidden font-['Inter']">
      <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[200] transition-all duration-500 transform ${toast.visible ? 'translate-y-0 opacity-100' : '-translate-y-12 opacity-0 pointer-events-none'}`}>
        <div className={`${toast.type === 'error' ? 'bg-red-600' : 'bg-gray-900'} text-white px-6 py-3 rounded-full shadow-2xl flex items-center space-x-3 min-w-[240px] justify-center`}>
           <span className="text-sm font-bold tracking-tight">{toast.message}</span>
        </div>
      </div>

      {(activeView === 'Closet' || activeView === 'Outfits') && (
        <header className="px-5 pt-8 pb-2 flex justify-between items-center bg-white sticky top-0 z-40">
          <div className="flex items-center space-x-3">
             <div className="w-8 h-8 bg-[#fde18b] rounded-xl flex items-center justify-center"><UserIcon size={16} className="text-gray-900" /></div>
             <h1 className="text-xl font-black text-[#1a1a1a] tracking-tight">{activeView === 'Closet' ? 'My Closet' : 'Style Gallery'}</h1>
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-xl"><SlidersHorizontal size={22} /></button>
        </header>
      )}

      <main className={`flex-1 overflow-y-auto ${activeView === 'Discover' ? '' : 'pb-20'}`}>
        {!isHydrated.current ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4"><Loader2 size={32} className="animate-spin text-[#fde18b]" /></div>
        ) : (
          <>
            {activeView === 'Closet' && <Closet items={items} onUpdateItem={(it) => setItems(prev => prev.map(i => i.id === it.id ? it : i))} onDeleteItem={handleDeleteItem} onAddToTryOn={() => setActiveView('Outfits')} />}
            {activeView === 'Discover' && <Discover items={items} userPhoto={userProfile.bodyPhotoUrl || userProfile.photoUrl} onSaveOutfit={handleSaveOutfit} />}
            {activeView === 'Calendar' && <CalendarView outfits={outfits} calendarMap={calendarMap} onUpdateCalendar={setCalendarMap} />}
            {activeView === 'Outfits' && <Outfits items={items} outfits={outfits} userProfile={userProfile} onSaveOutfit={handleSaveOutfit} onUpdateOutfit={(uo) => setOutfits(p => p.map(o => o.id === uo.id ? uo : o))} onDeleteOutfit={(id) => setOutfits(p => p.filter(o => o.id !== id))} onSetTodayOutfit={(id) => setCalendarMap(prev => ({...prev, [new Date().toISOString().split('T')[0]]: id}))} />}
            {activeView === 'Profile' && (
              <div className="flex flex-col h-full bg-[#fafafa]">
                <header className="px-6 pt-10 pb-6 flex items-center justify-between bg-white border-b border-gray-100"><h2 className="text-xl font-black">Account</h2><button onClick={handleLogout} className="text-gray-400 hover:text-red-500"><LogOut /></button></header>
                <div className="p-8 space-y-8 flex flex-col items-center">
                  <div className="w-28 h-28 rounded-[36px] bg-gray-50 border-2 border-[#fde18b]/30 flex items-center justify-center relative">
                    {userProfile.photoUrl ? <img src={userProfile.photoUrl} className="w-full h-full object-cover rounded-[36px]" /> : <UserIcon className="text-gray-200" size={48} />}
                    <label className="absolute -bottom-1 -right-1 w-9 h-9 bg-gray-900 text-[#fde18b] rounded-2xl flex items-center justify-center cursor-pointer"><input type="file" className="hidden" onChange={async (e) => {const f = e.target.files?.[0]; if(f){const r = new FileReader(); r.onloadend = async () => { const compressed = await compressImage(r.result as string, 512, 0.7); setUserProfile(p => ({...p, photoUrl: compressed})); }; r.readAsDataURL(f);}}} /><Camera size={16}/></label>
                  </div>
                  <h3 className="text-2xl font-black">{userProfile.name}</h3>
                  <div className="w-full space-y-4 px-4">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Body Photo (For AI Try-On)</p>
                    <div className="w-full h-40 bg-white border-2 border-dashed border-gray-100 rounded-3xl flex items-center justify-center relative cursor-pointer overflow-hidden" onClick={() => document.getElementById('body-pick')?.click()}>
                      <input id="body-pick" type="file" className="hidden" onChange={async (e) => {const f = e.target.files?.[0]; if(f){const r = new FileReader(); r.onloadend = async () => { const compressed = await compressImage(r.result as string, 800, 0.7); setUserProfile(p => ({...p, bodyPhotoUrl: compressed})); }; r.readAsDataURL(f);}}} />
                      {userProfile.bodyPhotoUrl ? <img src={userProfile.bodyPhotoUrl} className="w-full h-full object-cover" /> : <UserCheck className="text-gray-200" size={40} />}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {activeView === 'Closet' && currentUser && isHydrated.current && (
        <div className="fixed bottom-24 right-6 z-50 flex flex-col items-end space-y-4">
          <label className="cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
            <div className={`w-14 h-14 bg-gray-900 text-[#fde18b] rounded-full shadow-lg flex items-center justify-center transition-all ${isUploading ? 'opacity-70' : ''}`}>
              {isUploading ? <Loader2 className="animate-spin" /> : <Plus size={28} strokeWidth={3} />}
            </div>
          </label>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-100 h-20 flex justify-between items-center px-4 z-50 shadow-lg">
        <NavButton view="Closet" icon={ShoppingBag} label="Closet" />
        <NavButton view="Discover" icon={Compass} label="Discover" />
        <NavButton view="Outfits" icon={Sparkles} label="Outfits" />
        <NavButton view="Calendar" icon={CalendarIcon} label="Calendar" />
        <NavButton view="Profile" icon={UserIcon} label="Profile" />
      </nav>
      <style>{`@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`}</style>
    </div>
  );
};

export default App;
