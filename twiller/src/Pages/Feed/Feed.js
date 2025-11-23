import React, { useEffect, useState } from 'react'
import './Feed.css'
import Posts from './Posts/Posts'
import Tweetbox from './Tweetbox/Tweetbox'
import { useUserAuth } from '../../context/UserAuthContext'

const Feed = () => {
  const [posts, setPosts] = useState([])
  const [activeTab, setActiveTab] = useState('home')

  const { user } = useUserAuth()

  const loadHomeFeed = () => {
    fetch(`${process.env.REACT_APP_API_URL}/post`)
      .then((res) => res.json())
      .then((data) => setPosts(data))
  }

  const loadFollowingFeed = () => {
    fetch(`${process.env.REACT_APP_API_URL}/feed/following?email=${user.email}`)
      .then((res) => res.json())
      .then((data) => setPosts(data))
  }

  useEffect(() => {
    if (activeTab === 'home') loadHomeFeed()
    if (activeTab === 'following') loadFollowingFeed()
  }, [activeTab])

  const reloadPosts = () => {
    if (activeTab === 'home') loadHomeFeed()
  }

  return (
    <div className="feed">
      <div className="feed__header">
        <h2>Home</h2>
      </div>

      <div className="feed-tabs">
        <button
          className={activeTab === 'home' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('home')}
        >
          General
        </button>

        <button
          className={activeTab === 'following' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('following')}
        >
          Following
        </button>
      </div>

      {activeTab === 'home' && <Tweetbox reloadPosts={reloadPosts} />}

      {posts.map((p) => (
        <Posts key={p._id} p={p} />
      ))}
    </div>
  )
}

export default Feed
