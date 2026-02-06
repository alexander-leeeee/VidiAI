import React, { useEffect, useState } from 'react';
import { Users, CreditCard, Activity, Banknote, Zap } from 'lucide-react';

const AdminPanel: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://server.vidiai.top/api/get_admin_stats.php')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') setStats(data.stats);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-10 text-center">Завантаження статистики...</div>;

  const cards = [
    { title: "Всього юзерів", value: stats.total_users, icon: <Users />, color: "bg-blue-500" },
    { title: "Оплатили", value: stats.paid_users, icon: <CreditCard />, color: "bg-green-500" },
    { title: "Не оплатили", value: stats.free_users, icon: <Zap />, color: "bg-yellow-500" },
    { title: "Активні (24г)", value: stats.active_24h, icon: <Activity />, color: "bg-purple-500" },
    { title: "Дохід", value: `${stats.total_revenue} ₴`, icon: <Banknote />, color: "bg-emerald-500" },
  ];

  return (
    <div className="p-4 pb-24 space-y-4">
      <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Адмін-панель</h2>
      
      <div className="grid grid-cols-2 gap-3">
        {cards.map((card, i) => (
          <div key={i} className="bg-white/5 border border-white/10 p-4 rounded-3xl">
            <div className={`w-10 h-10 ${card.color} rounded-2xl flex items-center justify-center mb-3 text-white`}>
              {card.icon}
            </div>
            <p className="text-xs text-white/50 font-bold uppercase">{card.title}</p>
            <p className="text-xl font-black text-white">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-primary/20 to-secondary/20 p-6 rounded-3xl border border-white/10 text-center">
        <p className="text-sm text-white/60 mb-1">Всього генерацій</p>
        <p className="text-4xl font-black text-white">{stats.total_generations}</p>
      </div>
    </div>
  );
};

export default AdminPanel;
