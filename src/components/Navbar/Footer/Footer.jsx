import React, { useState } from 'react'
import './Footer.css'
import youtube_icon from '../../../assets/youtube_icon.png'
import twitter_icon from '../../../assets/twitter_icon.png'
import instagram_icon from '../../../assets/instagram_icon.png'
import facebook_icon from '../../../assets/facebook_icon.png'

const Footer = () => {
  const [serviceCode, setServiceCode] = useState(false)

  return (
    <footer className="footer">
      <div className="footer-icons">
        <a href="#facebook" className="social-icon" aria-label="Facebook">
          <img src={facebook_icon} alt="" />
        </a>
        <a href="#instagram" className="social-icon" aria-label="Instagram">
          <img src={instagram_icon} alt="" />
        </a>
        <a href="#twitter" className="social-icon" aria-label="Twitter">
          <img src={twitter_icon} alt="" />
        </a>
        <a href="#youtube" className="social-icon" aria-label="YouTube">
          <img src={youtube_icon} alt="" />
        </a>
      </div>

      <ul className="footer-links">
        <li><a href="#audio">Audio Description</a></li>
        <li><a href="#help">Help Center</a></li>
        <li><a href="#cards">Gift Cards</a></li>
        <li><a href="#media">Media Center</a></li>
        <li><a href="#investors">Investor Relations</a></li>
        <li><a href="#jobs">Jobs</a></li>
        <li><a href="#terms">Terms of Use</a></li>
        <li><a href="#privacy">Privacy</a></li>
        <li><a href="#legal">Legal Notices</a></li>
        <li><a href="#cookies">Cookie Preferences</a></li>
        <li><a href="#corporate">Corporate Information</a></li>
        <li><a href="#contact">Contact Us</a></li>
      </ul>

      <div className="footer-service">
        <button
          className="service-btn"
          onClick={() => setServiceCode(!serviceCode)}
        >
          {serviceCode ? "092-481" : "Service Code"}
        </button>
      </div>

      <p className="copyright-text">© 2025 Neplify, Inc. · All Rights Reserved</p>
    </footer>
  )
}

export default Footer
