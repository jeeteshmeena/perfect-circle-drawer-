import React, { useState, useRef, useEffect } from 'react';
import { Share2, Twitter, Send, MessageCircle, Copy, X } from 'lucide-react';

const TRANSLATIONS = {
  "en-US": {
    "drawCompleteCircle": "Draw a complete circle!",
    "perfectCircle": "Perfect circle! You're a true artist! ✨",
    "excellent": "Excellent! Almost perfect! 🎯",
    "greatJob": "Great job! Very circular! 👏",
    "goodEffort": "Good effort! Keep practicing! 💪",
    "notBad": "Not bad! Try drawing slower? 🖊️",
    "anotherShot": "Give it another shot! Practice makes perfect! 🔄",
    "abstractArt": "Hmm, that looks more like abstract art! 🎨",
    "clear": "Clear",
    "hideGrid": "Hide grid",
    "showGrid": "Show grid",
    "drawPerfectCircle": "Draw a perfect circle",
    "clickAndDrag": "Click and drag to draw your circle",
    "bestScore": "Best score",
    "attempts": "Attempts",
    "tryAgain": "Try again"
  },
  /* LOCALE_PLACEHOLDER_START */
  "es-ES": {
    "drawCompleteCircle": "¡Dibuja un círculo completo!",
    "perfectCircle": "¡Círculo perfecto! ¡Eres un verdadero artista! ✨",
    "excellent": "¡Excelente! ¡Casi perfecto! 🎯",
    "greatJob": "¡Buen trabajo! ¡Muy circular! 👏",
    "goodEffort": "¡Buen esfuerzo! ¡Sigue practicando! 💪",
    "notBad": "¡No está mal! ¿Intentas dibujar más lento? 🖊️",
    "anotherShot": "¡Inténtalo de nuevo! ¡La práctica hace al maestro! 🔄",
    "abstractArt": "¡Hmm, eso parece más arte abstracto! 🎨",
    "clear": "Limpiar",
    "hideGrid": "Ocultar cuadrícula",
    "showGrid": "Mostrar cuadrícula",
    "drawPerfectCircle": "Dibuja un círculo perfecto",
    "clickAndDrag": "Haz clic y arrastra para dibujar tu círculo",
    "bestScore": "Mejor puntuación",
    "attempts": "Intentos",
    "tryAgain": "Intentar de nuevo"
  }
  /* LOCALE_PLACEHOLDER_END */
};

const appLocale = '{{APP_LOCALE}}';
const browserLocale = navigator.languages?.[0] || navigator.language || 'en-US';
const findMatchingLocale = (locale) => {
  if (TRANSLATIONS[locale]) return locale;
  const lang = locale.split('-')[0];
  const match = Object.keys(TRANSLATIONS).find(key => key.startsWith(lang + '-'));
  return match || 'en-US';
};
const locale = (appLocale !== '{{APP_LOCALE}}') ? findMatchingLocale(appLocale) : findMatchingLocale(browserLocale);
const t = (key) => TRANSLATIONS[locale]?.[key] || TRANSLATIONS['en-US'][key] || key;

export default function DrawPerfectCircle() {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [points, setPoints] = useState([]);
  const [result, setResult] = useState(null);
  const [showGrid, setShowGrid] = useState(true);
  const [bestScore, setBestScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Function to evaluate circle quality
  const evaluateCircle = (points) => {
    if (points.length < 10) {
      return { score: 0, message: t('drawCompleteCircle') };
    }

    // Calculate center using average of all points
    const center = points.reduce((acc, point) => ({
      x: acc.x + point.x,
      y: acc.y + point.y
    }), { x: 0, y: 0 });
    
    center.x /= points.length;
    center.y /= points.length;

    // Calculate average radius and variance
    let avgRadius = 0;
    for (const point of points) {
      const distance = Math.sqrt(
        Math.pow(point.x - center.x, 2) + 
        Math.pow(point.y - center.y, 2)
      );
      avgRadius += distance;
    }
    avgRadius /= points.length;

    let radiusVariance = 0;
    for (const point of points) {
      const distance = Math.sqrt(
        Math.pow(point.x - center.x, 2) + 
        Math.pow(point.y - center.y, 2)
      );
      radiusVariance += Math.pow(distance - avgRadius, 2);
    }
    radiusVariance = Math.sqrt(radiusVariance / points.length);

    // Check if circle is closed
    const startPoint = points[0];
    const endPoint = points[points.length - 1];
    const closureDistance = Math.sqrt(
      Math.pow(endPoint.x - startPoint.x, 2) + 
      Math.pow(endPoint.y - startPoint.y, 2)
    );
    const maxClosureDistance = avgRadius * 0.2;
    const isClosed = closureDistance < maxClosureDistance;

    // Calculate score
    const maxVariance = avgRadius * 0.5;
    const varianceScore = Math.max(0, 1 - (radiusVariance / maxVariance));
    const closureScore = isClosed ? 1 : 0.5;
    
    let totalScore = Math.round((varianceScore * 0.6 + closureScore * 0.4) * 100);
    totalScore = Math.max(0, Math.min(100, totalScore));

    // Get appropriate message
    let message;
    if (totalScore >= 95) {
      message = t('perfectCircle');
    } else if (totalScore >= 85) {
      message = t('excellent');
    } else if (totalScore >= 75) {
      message = t('greatJob');
    } else if (totalScore >= 60) {
      message = t('goodEffort');
    } else if (totalScore >= 40) {
      message = t('notBad');
    } else if (totalScore >= 20) {
      message = t('anotherShot');
    } else {
      message = t('abstractArt');
    }

    return { score: totalScore, message, isClosed };
  };

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Set canvas size and scale for high DPI displays
      const scale = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * scale;
      canvas.height = window.innerHeight * scale;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.scale(scale, scale);
      
      const handleResize = () => {
        const scale = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * scale;
        canvas.height = window.innerHeight * scale;
        canvas.style.width = window.innerWidth + 'px';
        canvas.style.height = window.innerHeight + 'px';
        ctx.scale(scale, scale);
        drawCanvas();
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  useEffect(() => {
    drawCanvas();
  }, [points, showGrid, result]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const displayWidth = canvas.width / (window.devicePixelRatio || 1);
    const displayHeight = canvas.height / (window.devicePixelRatio || 1);
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, displayWidth, displayHeight);
    
    // Draw grid if enabled
    if (showGrid) {
      ctx.strokeStyle = '#f0f0f0';
      ctx.lineWidth = 1;
      const gridSize = 40;
      
      for (let x = 0; x < displayWidth; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, displayHeight);
        ctx.stroke();
      }
      
      for (let y = 0; y < displayHeight; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(displayWidth, y);
        ctx.stroke();
      }
    }
    
    // Draw the circle
    if (points.length > 1) {
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      
      ctx.stroke();
    }
    
    // Draw result overlay if exists
    if (result) {
      // Semi-transparent overlay
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(0, 0, displayWidth, displayHeight);
      
      // Score display
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 72px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const scoreText = `${result.score}/100`;
      ctx.fillText(scoreText, displayWidth / 2, displayHeight / 2 - 50);
      
      // Message
      ctx.font = '24px system-ui, -apple-system, sans-serif';
      ctx.fillText(result.message, displayWidth / 2, displayHeight / 2 + 30);
      
      // Stats
      ctx.font = '18px system-ui, -apple-system, sans-serif';
      ctx.fillText(`${t('bestScore')}: ${bestScore} | ${t('attempts')}: ${attempts}`, displayWidth / 2, displayHeight / 2 + 70);
    }
  };

  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const getTouchPos = (e) => {
    if (e.touches.length === 0) return null;
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top
    };
  };

  const startDrawing = (pos) => {
    if (!pos) return;
    setIsDrawing(true);
    setPoints([pos]);
    setResult(null);
  };

  const draw = (pos) => {
    if (!pos || !isDrawing || result) return;
    setPoints(prev => [...prev, pos]);
  };

  const stopDrawing = () => {
    if (!isDrawing || result) return;
    setIsDrawing(false);
    
    const evaluation = evaluateCircle(points);
    setResult(evaluation);
    setAttempts(prev => prev + 1);
    
    if (evaluation.score > bestScore) {
      setBestScore(evaluation.score);
    }
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    startDrawing(getMousePos(e));
  };

  const handleMouseMove = (e) => {
    e.preventDefault();
    draw(getMousePos(e));
  };

  const handleMouseUp = (e) => {
    e.preventDefault();
    stopDrawing();
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    startDrawing(getTouchPos(e));
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    draw(getTouchPos(e));
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    stopDrawing();
  };

  const clearCanvas = () => {
    setPoints([]);
    setResult(null);
    setShowShareModal(false);
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const closeShareModal = () => {
    setShowShareModal(false);
  };

  const gameLink = "https://your-game-site.com"; // Replace with your actual site link
  
  const shareText = `I scored ${result?.score || 0} in just ${attempts} attempts!\nCan you beat my score? Try now!`;
  
  const shareUrls = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(gameLink)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(gameLink)}&text=${encodeURIComponent(shareText)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText + '\n' + gameLink)}`
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(gameLink);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-white">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
      
      {/* Controls */}
      <div className="absolute top-4 left-4 flex gap-2">
        <button
          onClick={clearCanvas}
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
        >
          {t('clear')}
        </button>
        <button
          onClick={() => setShowGrid(!showGrid)}
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
        >
          {showGrid ? t('hideGrid') : t('showGrid')}
        </button>
      </div>
      
      {/* Instructions */}
      {points.length === 0 && !result && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
          <h1 className="text-4xl font-bold mb-4">{t('drawPerfectCircle')}</h1>
          <p className="text-gray-600 text-lg">{t('clickAndDrag')}</p>
          <p className="text-gray-500 text-sm mt-2">{t('bestScore')}: {bestScore} | {t('attempts')}: {attempts}</p>
        </div>
      )}
      
      {/* Try Again button */}
      {result && (
        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex gap-3">
          <button
            onClick={clearCanvas}
            className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            {t('tryAgain')}
          </button>
          <button
            onClick={handleShare}
            className="px-6 py-3 bg-white border-2 border-black text-black rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
          >
            <Share2 size={20} />
            Share
          </button>
        </div>
      )}
      
      {/* Footer */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <p className="text-gray-600 text-sm">
          Made With 💖 By JeetX
        </p>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 relative">
            <button
              onClick={closeShareModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-black transition-colors"
            >
              <X size={24} />
            </button>
            
            <h3 className="text-2xl font-bold mb-4 text-center">Share Your Score!</h3>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-6 text-center">
              <p className="text-lg font-semibold mb-2">
                I scored {result?.score || 0} in just {attempts} attempts!
              </p>
              <p className="text-gray-600">
                Can you beat my score? Try now!
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <a
                href={shareUrls.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3 px-4 border-2 border-black rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Twitter size={20} />
                Twitter
              </a>
              
              <a
                href={shareUrls.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3 px-4 border-2 border-black rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Send size={20} />
                Telegram
              </a>
              
              <a
                href={shareUrls.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3 px-4 border-2 border-black rounded-lg hover:bg-gray-100 transition-colors"
              >
                <MessageCircle size={20} />
                WhatsApp
              </a>
              
              <button
                onClick={copyLink}
                className="flex items-center justify-center gap-2 py-3 px-4 border-2 border-black rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Copy size={20} />
                {copySuccess ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-500 break-all">
                {gameLink}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
