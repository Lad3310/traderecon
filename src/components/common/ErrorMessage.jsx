import React from 'react'

const ErrorMessage = ({ message }) => (
  <div className="error-message">
    <h3>Error</h3>
    <p>{message}</p>
  </div>
)

export default ErrorMessage 