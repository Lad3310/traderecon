import React from 'react'

const ComparisonStatus = ({ status, isResolved, exceptionReason }) => {
  if (isResolved) {
    return <span className="status resolved">Resolved</span>
  }

  const getStatusClass = () => {
    switch (status.toLowerCase()) {
      case 'matched':
        return 'matched'
      case 'break':
      case 'failed':
        return 'break'
      case 'pending':
        return 'pending'
      default:
        return 'unmatched'
    }
  }

  return (
    <div>
      <span className={`status ${getStatusClass()}`}>
        {status}
      </span>
      {exceptionReason && (
        <div className="exception-reason">
          {exceptionReason}
        </div>
      )}
    </div>
  )
}

export default ComparisonStatus 