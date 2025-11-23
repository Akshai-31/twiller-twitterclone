import React, { useEffect, useState } from 'react'
import axios from 'axios'
import useLoggedinuser from '../../hooks/useLoggedinuser'

// ⭐ Import MUI Components
import { Card, CardContent, Typography, Button, Box } from '@mui/material'

const Notifications = () => {
  const [data, setData] = useState([])
  const [loggedinuser] = useLoggedinuser()

  const loadData = () => {
    axios
      .get(`${process.env.REACT_APP_API_URL}/notifications`, {
        params: { email: loggedinuser.email },
      })
      .then((res) => setData(res.data))
  }

  useEffect(() => {
    if (loggedinuser) loadData()
  }, [loggedinuser])

  const clearAll = () => {
    axios
      .delete(`${process.env.REACT_APP_API_URL}/notifications/clear`, {
        data: { email: loggedinuser.email },
      })
      .then(() => setData([]))
  }

  return (
    <Box sx={{ padding: '20px' }}>
      {/* HEADER CARD */}
      <Card
        sx={{
          marginBottom: '20px',
          padding: '10px',
          borderRadius: '16px',
          boxShadow: 3,
        }}
      >
        <CardContent
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="h5" fontWeight="bold">
            Notifications
          </Typography>

          <Button
            variant="contained"
            color="error"
            onClick={clearAll}
            size="small"
            sx={{ borderRadius: '20px', textTransform: 'none' }}
          >
            Clear All
          </Button>
        </CardContent>
      </Card>

      {/* NO DATA */}
      {data.length === 0 && (
        <Typography
          variant="body1"
          textAlign="center"
          sx={{ marginTop: '40px', opacity: 0.7 }}
        >
          No notifications
        </Typography>
      )}

      {/* NOTIFICATION CARDS */}
      {data.map((n) => (
        <Card
          key={n._id}
          sx={{
            marginBottom: '12px',
            borderRadius: '16px',
            padding: '10px',
            boxShadow: 2,
          }}
        >
          <CardContent>
            <Typography variant="body1">{n.message}</Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  )
}

export default Notifications
