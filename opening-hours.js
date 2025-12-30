// Google Places API configuration
const API_KEY = 'AIzaSyCYWs5ZAZV-xLazWaphLb-dsUgTDsU0Cm0';
const PLACE_ID = "ChIJfwpyZj-N2EcR08pMha2yaQM";

function displayOpeningHours(weekdayDescriptions, specialOpeningHours) {
  const openingHoursDiv = document.getElementById('opening-hours');
  
  if (!weekdayDescriptions || weekdayDescriptions.length === 0) {
    openingHoursDiv.innerHTML = '<p>Opening hours not available</p>';
    openingHoursDiv.classList.remove('loading');
    return;
  }

  let html = '<ul>';
  
  // Regular weekday hours
  weekdayDescriptions.forEach(dayText => {
    const parts = dayText.split(':');
    if (parts.length >= 2) {
      html += `<li><span class="day">${parts[0]}:</span> ${parts.slice(1).join(':').trim()}</li>`;
    } else {
      html += `<li>${dayText}</li>`;
    }
  });
  
  html += '</ul>';
  
  // Special opening hours (holidays, etc.)
  if (specialOpeningHours && specialOpeningHours.specialDays && specialOpeningHours.specialDays.length > 0) {
    html += '<h4 style="margin-top: 20px; margin-bottom: 10px; font-size: 18px; font-weight: normal;">Special Hours</h4>';
    html += '<ul>';
    
    specialOpeningHours.specialDays.forEach(specialDay => {
      const date = new Date(specialDay.date.year, specialDay.date.month - 1, specialDay.date.day);
      const dateStr = date.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      
      if (specialDay.hours) {
        // Has specific hours
        const hoursText = specialDay.hours.map(h => {
          const openTime = `${String(h.openTime.hours).padStart(2, '0')}:${String(h.openTime.minutes).padStart(2, '0')}`;
          const closeTime = `${String(h.closeTime.hours).padStart(2, '0')}:${String(h.closeTime.minutes).padStart(2, '0')}`;
          return `${openTime} - ${closeTime}`;
        }).join(', ');
        html += `<li><span class="day">${dateStr}:</span> ${hoursText}</li>`;
      } else {
        // Closed or no hours specified
        html += `<li><span class="day">${dateStr}:</span> Closed</li>`;
      }
    });
    
    html += '</ul>';
  }
  
  openingHoursDiv.innerHTML = html;
  openingHoursDiv.classList.remove('loading');
}

// Fetch opening hours from Google Places API
fetch(`https://places.googleapis.com/v1/places/${PLACE_ID}`, {
  headers: {
    "X-Goog-Api-Key": API_KEY,
    "X-Goog-FieldMask": "currentOpeningHours.weekdayDescriptions,currentOpeningHours.specialDays"
  }
})
  .then(res => {
    if (!res.ok) {
      return res.json().then(err => {
        console.error('API Error Response:', err);
        throw new Error(err.error?.message || `HTTP ${res.status}: ${res.statusText}`);
      });
    }
    return res.json();
  })
  .then(data => {
    console.log('API Response:', data);
    
    if (data.error) {
      console.error('API Error:', data.error);
      document.getElementById('opening-hours').innerHTML = `<p>Error: ${data.error.message || 'Unknown error'}</p>`;
      document.getElementById('opening-hours').classList.remove('loading');
      return;
    }
    
    // Check for weekdayDescriptions in the response
    // Places API (New) uses currentOpeningHours instead of openingHours
    const weekdayDescriptions = data.currentOpeningHours?.weekdayDescriptions || null;
    const specialOpeningHours = data.currentOpeningHours?.specialDays ? 
      { specialDays: data.currentOpeningHours.specialDays } : null;
    
    if (weekdayDescriptions && weekdayDescriptions.length > 0) {
      displayOpeningHours(weekdayDescriptions, specialOpeningHours);
    } else {
      console.warn('No opening hours in response:', data);
      console.warn('Available keys:', Object.keys(data));
      if (data.currentOpeningHours) {
        console.warn('currentOpeningHours structure:', data.currentOpeningHours);
      }
      document.getElementById('opening-hours').innerHTML = '<p>Opening hours not available</p>';
      document.getElementById('opening-hours').classList.remove('loading');
    }
  })
  .catch(error => {
    console.error('Error fetching opening hours:', error);
    document.getElementById('opening-hours').innerHTML = `<p>Unable to load opening hours: ${error.message}</p>`;
    document.getElementById('opening-hours').classList.remove('loading');
  });
