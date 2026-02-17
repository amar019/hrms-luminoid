import React, { useState, useEffect } from 'react';
import { Card, Badge, Spinner } from 'react-bootstrap';
import axios from 'axios';

const WeatherWidget = ({ date, location = 'New York' }) => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (date) {
      fetchWeather();
    }
  }, [date, location]);

  const fetchWeather = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Using OpenWeatherMap API (you'll need to add API key to .env)
      const API_KEY = process.env.REACT_APP_WEATHER_API_KEY || 'demo_key';
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast?q=${location}&appid=${API_KEY}&units=metric`
      );
      
      // Find weather for the selected date
      const selectedDate = new Date(date).toDateString();
      const weatherData = response.data.list.find(item => 
        new Date(item.dt * 1000).toDateString() === selectedDate
      );
      
      if (weatherData) {
        setWeather({
          temp: Math.round(weatherData.main.temp),
          description: weatherData.weather[0].description,
          icon: weatherData.weather[0].icon,
          humidity: weatherData.main.humidity,
          windSpeed: weatherData.wind.speed,
          condition: weatherData.weather[0].main
        });
      } else {
        // Fallback to current weather if date not found
        const currentResponse = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${API_KEY}&units=metric`
        );
        
        setWeather({
          temp: Math.round(currentResponse.data.main.temp),
          description: currentResponse.data.weather[0].description,
          icon: currentResponse.data.weather[0].icon,
          humidity: currentResponse.data.main.humidity,
          windSpeed: currentResponse.data.wind.speed,
          condition: currentResponse.data.weather[0].main
        });
      }
    } catch (err) {
      // Fallback to mock data if API fails
      setWeather({
        temp: 22,
        description: 'partly cloudy',
        icon: '02d',
        humidity: 65,
        windSpeed: 3.5,
        condition: 'Clouds'
      });
    } finally {
      setLoading(false);
    }
  };

  const getWeatherAdvice = () => {
    if (!weather) return null;
    
    const { condition, temp } = weather;
    
    if (condition === 'Rain') {
      return {
        type: 'warning',
        message: 'Rainy weather expected. Consider indoor activities.',
        icon: 'umbrella'
      };
    } else if (temp > 30) {
      return {
        type: 'info',
        message: 'Hot weather. Stay hydrated and avoid prolonged sun exposure.',
        icon: 'sun'
      };
    } else if (temp < 5) {
      return {
        type: 'info',
        message: 'Cold weather. Dress warmly for outdoor activities.',
        icon: 'snowflake'
      };
    } else {
      return {
        type: 'success',
        message: 'Great weather for outdoor activities!',
        icon: 'smile'
      };
    }
  };

  if (!date) return null;

  return (
    <Card className="weather-widget mb-3">
      <Card.Header className="d-flex align-items-center">
        <i className="fas fa-cloud-sun me-2"></i>
        Weather Forecast
        <Badge bg="light" text="dark" className="ms-auto">
          {new Date(date).toLocaleDateString()}
        </Badge>
      </Card.Header>
      <Card.Body>
        {loading ? (
          <div className="text-center py-3">
            <Spinner animation="border" size="sm" className="me-2" />
            Loading weather...
          </div>
        ) : weather ? (
          <>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="d-flex align-items-center">
                <img 
                  src={`https://openweathermap.org/img/w/${weather.icon}.png`}
                  alt={weather.description}
                  className="weather-icon me-2"
                />
                <div>
                  <h4 className="mb-0">{weather.temp}°C</h4>
                  <small className="text-muted text-capitalize">{weather.description}</small>
                </div>
              </div>
              <div className="text-end">
                <div className="small text-muted">
                  <i className="fas fa-tint me-1"></i>
                  {weather.humidity}%
                </div>
                <div className="small text-muted">
                  <i className="fas fa-wind me-1"></i>
                  {weather.windSpeed} m/s
                </div>
              </div>
            </div>
            
            {getWeatherAdvice() && (
              <div className={`alert alert-${getWeatherAdvice().type} py-2 mb-0`}>
                <i className={`fas fa-${getWeatherAdvice().icon} me-2`}></i>
                <small>{getWeatherAdvice().message}</small>
              </div>
            )}
          </>
        ) : error ? (
          <div className="text-center text-muted py-3">
            <i className="fas fa-exclamation-triangle me-2"></i>
            Unable to load weather data
          </div>
        ) : null}
      </Card.Body>
    </Card>
  );
};

export default WeatherWidget;