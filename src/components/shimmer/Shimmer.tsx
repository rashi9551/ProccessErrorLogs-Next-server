const SpinnerLoader = () => {
  return (
    <div className="animate-pulse flex flex-col ml-[39%] mt-[30%] justify-center items-center gap-4 w-60 h-full">
      <div className="flex flex-col items-center">
        <div className="w-48 h-6 bg-slate-400 rounded-md"></div>
        <div className="w-28 h-4 bg-slate-400 mx-auto mt-3 rounded-md"></div>
      </div>
      <div className="h-7 bg-blue-gray-400 w-full rounded-md"></div>
      <div className="h-7 bg-blue-gray-400 w-full rounded-md"></div>
      <div className="h-7 bg-blue-gray-400 w-full rounded-md"></div>
      <div className="h-7 bg-blue-gray-400 w-1/2 rounded-md"></div>
      <div className="h-7 bg-blue-gray-400 w-1/3 rounded-md"></div>
      <div className="h-7 bg-blue-gray-400 w-1/4 rounded-md"></div>
    </div>
  );
};

export default SpinnerLoader;
