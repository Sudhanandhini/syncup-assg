export default function ConnectionStatus({ status }) {
  const config = {
    connected: {
      dot: 'bg-green-400 animate-pulse-dot',
      text: 'Live',
      textColor: 'text-green-400',
    },
    disconnected: {
      dot: 'bg-red-400',
      text: 'Disconnected',
      textColor: 'text-red-400',
    },
    reconnecting: {
      dot: 'bg-yellow-400 animate-pulse',
      text: 'Reconnecting…',
      textColor: 'text-yellow-400',
    },
  }[status] || {
    dot: 'bg-gray-500',
    text: 'Connecting…',
    textColor: 'text-gray-400',
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${config.dot}`} />
      <span className={`text-xs font-medium ${config.textColor}`}>{config.text}</span>
    </div>
  );
}
