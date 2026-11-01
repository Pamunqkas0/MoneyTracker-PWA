'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Delete } from 'lucide-react';

interface PinLockscreenProps {
  mode: 'setup' | 'verify';
  onSuccess: (pin: string) => void;
  onLogout?: () => void; // Optional: "Forgot PIN" or "Logout" functionality
}

export function PinLockscreen({ mode, onSuccess, onLogout }: PinLockscreenProps) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm'>(mode === 'setup' ? 'enter' : 'confirm');
  const [isError, setIsError] = useState(false);
  const [message, setMessage] = useState(
    mode === 'setup' ? 'Buat PIN 6 digit Anda' : 'Masukkan PIN Anda'
  );

  const PIN_LENGTH = 6;

  const handleError = useCallback((msg: string) => {
    setIsError(true);
    setMessage(msg);
    setTimeout(() => {
      setPin('');
      setIsError(false);
      setMessage(mode === 'setup' && step === 'enter' ? 'Buat PIN 6 digit Anda' : mode === 'setup' && step === 'confirm' ? 'Konfirmasi PIN Anda' : 'Masukkan PIN Anda');
    }, 500); // Wait for shake animation to finish
  }, [mode, step]);

  const handlePinComplete = useCallback((currentPin: string) => {
    if (mode === 'setup') {
      if (step === 'enter') {
        setConfirmPin(currentPin);
        setPin('');
        setStep('confirm');
        setMessage('Konfirmasi PIN Anda');
      } else {
        if (currentPin === confirmPin) {
          onSuccess(currentPin);
        } else {
          handleError('PIN tidak cocok');
          setConfirmPin('');
          setStep('enter');
        }
      }
    } else {
      // mode === 'verify'
      onSuccess(currentPin);
    }
  }, [mode, step, confirmPin, onSuccess, handleError]);

  const handleKeyPress = (digit: string) => {
    if (pin.length < PIN_LENGTH && !isError) {
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length === PIN_LENGTH) {
        handlePinComplete(newPin);
      }
    }
  };
  // If validation fails from parent (verify mode)
  useEffect(() => {
    const handleValidationFailed = () => {
      handleError('PIN Salah');
    };
    window.addEventListener('pin-validation-failed', handleValidationFailed as EventListener);
    return () => window.removeEventListener('pin-validation-failed', handleValidationFailed as EventListener);
  }, [handleError]);

  const handleDelete = () => {
    if (pin.length > 0 && !isError) {
      setPin((prev) => prev.slice(0, -1));
    }
  };

  const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-[var(--background)] p-6 text-[var(--foreground)] sm:justify-center">
      {/* Header Space for mobile padding */}
      <div className="h-12 sm:hidden"></div>
      
      <div className="flex flex-col items-center justify-center space-y-10 sm:space-y-12">
        {/* Texts */}
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold sm:text-2xl">
            {mode === 'setup' ? 'Keamanan Tambahan' : 'Aplikasi Terkunci'}
          </h2>
          <motion.p 
            className={`text-sm sm:text-base ${isError ? 'text-red-500 font-medium' : 'text-slate-500 dark:text-slate-400'}`}
          >
            {message}
          </motion.p>
        </div>

        {/* PIN Dots */}
        <motion.div 
          className="flex space-x-4"
          animate={isError ? { x: [-10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <div
              key={i}
              className={`h-4 w-4 rounded-full border-2 sm:h-5 sm:w-5 transition-colors duration-200 ${
                i < pin.length
                  ? 'border-[var(--foreground)] bg-[var(--foreground)]'
                  : 'border-slate-300 dark:border-slate-600 bg-transparent'
              }`}
            />
          ))}
        </motion.div>
      </div>

      {/* Numpad */}
      <div className="mb-10 mt-12 grid w-full max-w-[280px] grid-cols-3 gap-6 sm:max-w-[320px] sm:gap-8">
        {nums.map((num) => (
          <motion.button
            key={num}
            whileTap={{ scale: 0.9, backgroundColor: 'rgba(128, 128, 128, 0.15)' }}
            onClick={() => handleKeyPress(num.toString())}
            className="flex h-16 w-16 items-center justify-center rounded-full text-2xl font-semibold sm:h-20 sm:w-20 sm:text-3xl"
          >
            {num}
          </motion.button>
        ))}
        
        {/* Bottom row */}
        <div className="flex items-center justify-center">
          {onLogout && mode === 'verify' && (
            <button 
              onClick={onLogout}
              className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              Lupa PIN?
            </button>
          )}
        </div>
        
        <motion.button
          whileTap={{ scale: 0.9, backgroundColor: 'rgba(128, 128, 128, 0.15)' }}
          onClick={() => handleKeyPress('0')}
          className="flex h-16 w-16 items-center justify-center rounded-full text-2xl font-semibold sm:h-20 sm:w-20 sm:text-3xl"
        >
          0
        </motion.button>
        
        <motion.button
          whileTap={{ scale: 0.9, backgroundColor: 'rgba(128, 128, 128, 0.15)' }}
          onClick={handleDelete}
          className="flex h-16 w-16 items-center justify-center rounded-full text-2xl sm:h-20 sm:w-20 sm:text-3xl"
        >
          <Delete size={28} />
        </motion.button>
      </div>
    </div>
  );
}
