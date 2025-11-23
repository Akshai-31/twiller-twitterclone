import React, { useEffect, useState } from 'react'
import { Box, Modal, IconButton, TextField } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import './Editprofile.css'

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 600,
  height: 600,
  bgcolor: 'background.paper',
  boxShadow: 24,
  borderRadius: 8,
}

function Editchild({ dob, setdob }) {
  const [open, setopen] = useState(false)

  return (
    <>
      <div className="birthdate-section" onClick={() => setopen(true)}>
        <text>Edit</text>
      </div>
      <Modal
        hideBackdrop
        open={open}
        onClose={() => setopen(false)}
        aria-labelledby="child-modal-title"
        aria-describedby="child-modal-description"
      >
        <Box sx={{ ...style, width: 300, height: 300 }}>
          <div className="text">
            <h2>Edit date of birth</h2>
            <p>
              This can only be changed a few times
              <br />
              Make sure you enter the age of the <br />
              person using the account.
            </p>
            <input
              type="date"
              value={dob}
              onChange={(e) => setdob(e.target.value)}
            />
            <button className="e-button" onClick={() => setopen(false)}>
              Cancel
            </button>
          </div>
        </Box>
      </Modal>
    </>
  )
}

const Editprofile = ({ user }) => {
  const [name, setname] = useState('')
  const [bio, setbio] = useState('')
  const [location, setlocation] = useState('')
  const [website, setwebsite] = useState('')
  const [dob, setdob] = useState('')
  const [open, setopen] = useState(false)
  const [loggedinuser, setloggedinuser] = useState(null)

  // ✅ Load from localStorage or fetch if missing
  useEffect(() => {
    const stored = localStorage.getItem('loggedinuser')
    if (stored) {
      const parsed = JSON.parse(stored)
      setloggedinuser(parsed)
      setname(parsed.name || '')
      setbio(parsed.bio || '')
      setlocation(parsed.location || '')
      setwebsite(parsed.website || '')
      setdob(parsed.dob || '')
    } else if (user?.email) {
      fetch(`/loggedinuser?email=${user.email}`)
        .then((res) => res.json())
        .then((data) => {
          const userData = data[0] || {}
          setloggedinuser(userData)
          localStorage.setItem('loggedinuser', JSON.stringify(userData))
          setname(userData.name || '')
          setbio(userData.bio || '')
          setlocation(userData.location || '')
          setwebsite(userData.website || '')
          setdob(userData.dob || '')
        })
        .catch((err) => console.error('Error fetching user:', err))
    }
  }, [user])

  // ✅ Handle save
  const handlesave = () => {
    if (!user?.email) return alert('User not logged in!')

    const editinfo = { name, bio, location, website, dob }

    fetch(`/userupdate/${user.email}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(editinfo),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log('Profile updated:', data)
        alert('Profile updated successfully!')
        localStorage.setItem(
          'loggedinuser',
          JSON.stringify({ ...loggedinuser, ...editinfo })
        )
        setopen(false)
      })
      .catch((err) => console.error('Error updating profile:', err))
  }

  return (
    <div>
      <button onClick={() => setopen(true)} className="Edit-profile-btn">
        Edit profile
      </button>

      <Modal
        open={open}
        onClose={() => setopen(false)}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box style={style} className="modal">
          <div className="header">
            <IconButton onClick={() => setopen(false)}>
              <CloseIcon />
            </IconButton>
            <h2 className="header-title">Edit Profile</h2>
            <button className="save-btn" onClick={handlesave}>
              Save
            </button>
          </div>

          <form className="fill-content">
            <TextField
              className="text-field"
              fullWidth
              label="Name"
              variant="filled"
              value={name}
              onChange={(e) => setname(e.target.value)}
            />
            <TextField
              className="text-field"
              fullWidth
              label="Bio"
              variant="filled"
              value={bio}
              onChange={(e) => setbio(e.target.value)}
            />
            <TextField
              className="text-field"
              fullWidth
              label="Location"
              variant="filled"
              value={location}
              onChange={(e) => setlocation(e.target.value)}
            />
            <TextField
              className="text-field"
              fullWidth
              label="Website"
              variant="filled"
              value={website}
              onChange={(e) => setwebsite(e.target.value)}
            />
          </form>

          <div className="birthdate-section">
            <p>Birth Date</p>
            <p>.</p>
            <Editchild dob={dob} setdob={setdob} />
          </div>

          <div className="last-section">
            <h2>{dob ? dob : 'Add your date of birth'}</h2>
            <div className="last-btn">
              <h2>Switch to Professional</h2>
              <ChevronRightIcon />
            </div>
          </div>
        </Box>
      </Modal>
    </div>
  )
}

export default Editprofile
