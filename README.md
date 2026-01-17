# Smart Closet AI 👗✨

**Smart Closet AI** is a cutting-edge, AI-driven personal wardrobe assistant designed to help you organize your closet, discover new style combinations, and plan your daily outfits with the power of Google Gemini.

## 🚀 Key Features

### 1. Intelligent Closet Management
*   **AI Auto-Categorization**: Upload a photo of any garment, and Gemini automatically identifies the category (Tops, Bottoms, Shoes, etc.), primary color, season, and tags.
*   **Automatic Background Removal**: Uses **Gemini 2.5 Flash Image** to create high-fidelity, professional-looking garment cutouts on pure white backgrounds.
*   **Smart Styling Suggestions**: Every item uploaded receives unique, AI-generated styling tips.

### 2. Style Gallery & AI Designer
*   **Outfit Evaluation**: Select multiple items and let Gemini rate the coordination (0-100) and provide a professional stylist's review.
*   **Realistic AI Try-On**: Generate high-quality cinematic previews of outfits being worn. If a body reference photo is provided in your profile, the AI attempts to use it for a realistic "Virtual Try-On" experience.
*   **Scenario-Based Collections**: Organize your looks by occasions like *Work*, *Casual*, *Party*, or *Vacation*.

### 3. Fashion Calendar
*   **Daily Log**: Keep track of what you wore each day.
*   **Visual Planning**: View your month at a glance with garment previews directly on the calendar grid.
*   **Outfit History**: Never repeat the same look unintentionally by checking your fashion history.

### 4. Smart Profile & Accounts
*   **Multi-User Support**: Simple login system that segregates data based on your "Fashion ID".
*   **Body Reference**: Upload a reference photo to help the AI generate more accurate and personalized outfit previews.
*   **Data Persistence**: All your data is saved locally to your browser, ensuring your closet is always there when you return.

## 🛠️ Tech Stack

*   **Frontend**: React 19 (ESM)
*   **AI Engine**: Google Gemini API (`@google/genai`)
    *   `gemini-3-flash-preview` (Logic & Text Analysis)
    *   `gemini-2.5-flash-image` (Image Generation & Background Removal)
*   **Styling**: Tailwind CSS
*   **Icons**: Lucide React
*   **3D Rendering**: Three.js (Mannequin morphology and interactive fitting room)

## 📖 How to Use

1.  **Login**: Enter a unique username to start your personal collection.
2.  **Upload**: Go to the **Closet** tab and tap the **+** button. Upload photos of your clothes. Wait for the "AI Analyzing" and "Processing" phases to complete.
3.  **Design**: Head to the **Outfits** tab. Tap **+** to create a new look. Select a top and bottom, then tap **AI Analyze** to get a score.
4.  **Save**: Save your look. The AI will begin "Cinematic Rendering" to show you a preview of the outfit.
5.  **Schedule**: In the **Calendar** tab, select a date and pick one of your saved outfits to plan your look for that day.

## 🛡️ Privacy & Storage
This application is a client-side prototype. All image data and closet information are stored in your browser's `localStorage`. No data is stored on a centralized server other than the temporary processing performed by the Google Gemini API.

---
*Built with ❤️ by a World-Class Senior Frontend Engineer.*