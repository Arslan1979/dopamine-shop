import { useState, useEffect } from 'react';
import { audioManager } from '../../lib/audio/AudioManager';
import { Volume2, VolumeX, Music } from 'lucide-react';

export default function SoundSettings() {
  const [settings, setSettings] = useState({ enabled: true, volume: 1.0 });

  useEffect(() => {
    setSettings(audioManager.getSettings());
  }, []);

  function toggleSound() {
    const newEnabled = !settings.enabled;
    audioManager.setEnabled(newEnabled);
    setSettings({ ...settings, enabled: newEnabled });
  }

  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const volume = parseFloat(e.target.value);
    audioManager.setVolume(volume);
    setSettings({ ...settings, volume });
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <Music className="w-5 h-5 text-primary-600" />
        <h3 className="font-semibold text-slate-900">Звуковые эффекты</h3>
      </div>

      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-slate-600">Включить звуки</span>
        <button
          onClick={toggleSound}
          className={`p-2 rounded-lg transition-colors ${
            settings.enabled ? 'bg-primary-100 text-primary-600' : 'bg-slate-100 text-slate-400'
          }`}
        >
          {settings.enabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Громкость</span>
          <span className="font-medium text-slate-900">{Math.round(settings.volume * 100)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={settings.volume}
          onChange={handleVolumeChange}
          disabled={!settings.enabled}
          className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-primary-600 disabled:opacity-50"
        />
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100">
        <p className="text-xs text-slate-400">
          Звуки: добавление в корзину, покупка, достижения, ошибки
        </p>
      </div>
    </div>
  );
}
