  const renderDetails = () => {
    if (!fullDetails) return null;

    return (
      <div className="table w-full mt-2 mb-4 border-collapse">
        {fullDetails.split('\n').map((line: string, index: number) => {
          if (line.trim().toLowerCase() === 'details:') return null;
          const cleanLine = line.replace(/^[-–\s]+/, '').trim();
          if (!cleanLine) return null;

          const colonIndex = cleanLine.indexOf(':');

          if (colonIndex !== -1) {
            const label = cleanLine.substring(0, colonIndex).trim();
            const value = cleanLine.substring(colonIndex + 1).trim();

            return (
              <div key={index} className="table-row">
                {/* লেবেল সেল */}
                <div className="table-cell font-semibold text-zinc-400 pr-2 align-top whitespace-nowrap">
                  {label}
                </div>
                {/* কোলন এবং ভ্যালু সেল */}
                <div className="table-cell text-white align-top">
                  <span className="pr-1">:</span>{value}
                </div>
              </div>
            );
          }
          return (
            <div key={index} className="table-row">
              <div className="table-cell text-white font-medium pt-2" colSpan={2}>
                {cleanLine}
              </div>
            </div>
          );
        })}
      </div>
    );
  };
