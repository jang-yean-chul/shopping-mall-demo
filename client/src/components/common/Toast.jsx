import useToastStore from '@/store/toastStore';
import './Toast.css';

export default function Toast() {
  const message = useToastStore((s) => s.message);
  return (
    <div className={`toast${message ? ' toast--visible' : ''}`}>
      {message}
    </div>
  );
}
