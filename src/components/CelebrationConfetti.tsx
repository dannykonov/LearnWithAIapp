
import React, { useEffect, useState } from 'react';

interface CelebrationConfettiProps {
  show: boolean;
}

const CelebrationConfetti: React.FC<CelebrationConfettiProps> = ({ show }) => {
  const [confetti, setConfetti] = useState<{ id: number; top: number; left: number; color: string; delay: number; size: number; rotation: number }[]>([]);
  
  useEffect(() => {
    if (show) {
      const colors = ['#1D3557', '#457B9D', '#A8DADC', '#E63946', '#F1FAEE', '#FFD700', '#4CAF50'];
      const newConfetti = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        top: Math.random() * 20,
        left: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 5,
        size: Math.random() * 1.5 + 0.5,
        rotation: Math.random() * 360
      }));
      
      setConfetti(newConfetti);
      
      // Clean up confetti after animation
      const timer = setTimeout(() => {
        setConfetti([]);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [show]);
  
  if (!show) return null;
  
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {confetti.map((item) => (
        <div
          key={item.id}
          className="confetti"
          style={{
            top: `${item.top}%`,
            left: `${item.left}%`,
            backgroundColor: item.color,
            width: `${item.size}rem`,
            height: `${item.size}rem`,
            animationDelay: `${item.delay}s`,
            transform: `rotate(${item.rotation}deg)`,
            boxShadow: '0 0 10px rgba(255,255,255,0.5)'
          }}
        />
      ))}
      
      {/* Achievement message */}
      <div className="fixed top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-md p-6 rounded-xl shadow-2xl z-50 animate-float">
        <div className="text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h3 className="text-xl font-bold text-lwai-deepBlue mb-2">Achievement Unlocked!</h3>
          <p className="text-lwai-skyBlue">Keep going - you're doing great!</p>
        </div>
      </div>
    </div>
  );
};

export default CelebrationConfetti;
