import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../../assets/logo/mew-logo-dark.png';
const Header = () => {
  return (
    <div className="flex px-4 py-2 justify-around h-12 items-center">
      <img className="object-contain w-24" src={Logo} alt="Logo" />
      <div class="flex space-x-4">
        <Link to="/intro" class="text-black hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-xl font-medium">
          Wallet
        </Link>
        <Link to="/explorer" class="text-black hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-xl font-medium">
          Explorer
        </Link>
      </div>
    </div>
  );
};

export default Header;
