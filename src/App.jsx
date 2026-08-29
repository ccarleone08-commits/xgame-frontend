import './App.css'
import Navbar from './components/mainLayout/Navbar'
import TopBar from './components/mainLayout/TopBar'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider, useAppContext } from './context/AppContext'
import LandingPage from './components/mainPage/LandingPage'
import Login from './components/auth/Login'
import Register from './components/auth/Register'
import Profile from './components/profile/Profile'
import Wallet from './components/wallet/Wallet'
import Chat from './components/chat/Chat'
import ScrollToTop from './context/ScrollToTop'
import ProtectedRoute from './components/auth/ProtectedRoute'

import RouteStyleController from './context/RouteStyleController.jsx'

// Games Import 
import Games from './components/games/Games'
import LotoLobby from './components/games/loto/LotoLobby.jsx'
import LotoGame from './components/games/loto/LotoGame.jsx'
import Backgammon from './components/games/backgammon/Backgammon.jsx'
import SekaGame from './components/games/seka/SekaGame.jsx'
import DurakGame from './components/games/durak/DurakGame.jsx'
import PokerGame from './components/games/poker/PokerGame.jsx'
import DominoGame from './components/games/domino/DominoGame.jsx'
import OkeyGame from './components/games/okey/OkeyGame.jsx'

import NotFound from './components/mainLayout/NotFound.jsx'

import AddBalance from './components/wallet/AddBalance.jsx'


// import BackgammonGame from './components/games/BACKGAMMMONN/BackgammonREACT.jsx'

// import { Howler } from "howler";
// import { SoundProvider } from './context/SoundContext.jsx'

const ProtectedRouteWrapper = ({ children }) => {
  const { isAuthenticated } = useAppContext();
  return <ProtectedRoute isAuthenticated={isAuthenticated}>{children}</ProtectedRoute>;
};


function App() {

   return (
     <BrowserRouter>
       <AppProvider>
           <div className="app">
             <TopBar />
             <main className="main-content">
               <RouteStyleController />
               {/* <SnowEffect snowflakeCount={7} /> */}
               <ScrollToTop />
               <Routes>

                 <Route path="/stats" element={<LandingPage />} />
                 
                 <Route path="/login" element={<Login />} />
                 <Route path="/register" element={<Register />} />
                 <Route
                   path="/"
                   element={
                     // <ProtectedRouteWrapper>
                       <Games />
                     // </ProtectedRouteWrapper>
                   }
                 />
                 <Route
                   path="/games"
                   element={
                     // <ProtectedRouteWrapper>
                       <Games />
                     // </ProtectedRouteWrapper>
                   }
                 />
                 <Route
                   path="/games/loto"
                   element={
                     <ProtectedRouteWrapper>
                       <LotoLobby />
                     </ProtectedRouteWrapper>
                   }
                 />
                 <Route
                   path="/games/loto/:roomId"
                   element={
                     <ProtectedRouteWrapper>
                       <LotoGame />
                     </ProtectedRouteWrapper>
                   }
                 />
                 <Route
                   path="/games/backgammon"
                   element={
                     <ProtectedRouteWrapper>
                       <Backgammon />
                     </ProtectedRouteWrapper>
                   }
                 />
                 <Route
                   path="/games/seka"
                   element={
                     <ProtectedRouteWrapper>
                       <SekaGame />
                     </ProtectedRouteWrapper>
                   }
                 />
                 <Route
                   path="/games/durak"
                   element={
                     <ProtectedRouteWrapper>
                       <DurakGame />
                     </ProtectedRouteWrapper>
                   }
                 />
                 <Route
                   path="/games/poker"
                   element={
                     <ProtectedRouteWrapper>
                       <PokerGame />
                     </ProtectedRouteWrapper>
                   }
                 />
                 <Route
                   path="/games/domino"
                   element={
                     <ProtectedRouteWrapper>
                       <DominoGame />
                     </ProtectedRouteWrapper>
                   }
                 />
                 <Route
                   path="/games/okey"
                   element={
                     <ProtectedRouteWrapper>
                       <OkeyGame />
                     </ProtectedRouteWrapper>
                   }
                 />
                 <Route
                   path="/chat"
                   element={
                     <ProtectedRouteWrapper>
                       <Chat />
                     </ProtectedRouteWrapper>
                   }
                 />
                 <Route
                   path="/wallet"
                   element={
                     <ProtectedRouteWrapper>
                       <Wallet />
                     </ProtectedRouteWrapper>
                   }
                 />
                 <Route
                   path="/profile"
                   element={
                     <ProtectedRouteWrapper>
                       <Profile />
                     </ProtectedRouteWrapper>
                   }
                 />
                 <Route
                   path="/deposit"
                   element={
                     <ProtectedRouteWrapper>
                       <AddBalance />
                     </ProtectedRouteWrapper>
                   }
                 />

                 <Route path="*" element={<NotFound />} />

               </Routes>
             </main>
             <Navbar />
             {/* <Footer /> */}
           </div>
       </AppProvider>
     </BrowserRouter>
   );
  //return <PaymentProblem />;
}
export default App
