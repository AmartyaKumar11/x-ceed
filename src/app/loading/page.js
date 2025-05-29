'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './loading.module.css';

export default function LoadingPage() {
  const router = useRouter();
  const [text, setText] = useState('');
  const [complete, setComplete] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  
  const fullText = 'X-CEED';
    useEffect(() => {    // Type out the text character by character with faster speed
    if (text.length < fullText.length) {
      const timeout = setTimeout(() => {
        setText(fullText.substring(0, text.length + 1));
      }, 100); 
      
      return () => clearTimeout(timeout);
    } else {      // When typing is complete, wait a moment before fade out
      setComplete(true);
      const timeout = setTimeout(() => {
        setFadeOut(true);
        
        // Redirect after slide-up animation completes
        setTimeout(() => {
          router.replace('/auth');
        }, 600); // Shorter duration for quicker transition
      }, 1000); // Reduced time to see complete text
      
      return () => clearTimeout(timeout);
    }
  }, [text, router]);

  return (
    <div className={`${styles.container} ${fadeOut ? styles.fadeOut : ''}`}>
      <div className={styles.content}>
        <h1 className={styles.title}>
          {text}
          <span className={`${styles.cursor} ${complete ? styles.cursorHidden : ''}`}></span>
        </h1>
      </div>
    </div>
  );
}