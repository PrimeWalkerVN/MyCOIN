import React from 'react';

const NotFound = () => {
  return (
    <div className="w-full h-screen flex justify-center items-center">
      <div className="container h-64 w-1/3 bg-gray-200 flex justify-center items-center">
        <div className="mx-20 flex flex-col justify-center">
          <h1>Sorry.... Page not found!</h1>
          <span className="text-base text-gray-600">Looks like you've followed a broken link or entered a URL that doesn't exist on this site!</span>
          <div className="text-base text-blue-500">
            &#8592; <a href="/">Back to out site</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
