import { Router, Request, Response } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { didService } from '../services/did.service'

const UPLOAD_DIR = path.join(__dirname, '../../uploads')

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `avatar${ext}`)
  },
})

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'))
    }
  },
})

const router = Router()

router.post('/upload', upload.single('avatar'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' })
      return
    }

    const avatarPath = `/uploads/${req.file.filename}`

    // Update D-ID service with new avatar URL
    const fullUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}${avatarPath}`
    didService.setSourceImage(fullUrl)

    res.json({
      success: true,
      avatarUrl: avatarPath,
    })
  } catch (error) {
    console.error('Avatar upload error:', error)
    res.status(500).json({ error: 'Failed to upload avatar' })
  }
})

router.get('/current', (req: Request, res: Response) => {
  const avatarPath = path.join(UPLOAD_DIR, 'avatar.jpg')
  const avatarPngPath = path.join(UPLOAD_DIR, 'avatar.png')

  if (fs.existsSync(avatarPath)) {
    res.json({ avatarUrl: '/uploads/avatar.jpg' })
  } else if (fs.existsSync(avatarPngPath)) {
    res.json({ avatarUrl: '/uploads/avatar.png' })
  } else {
    res.json({ avatarUrl: null })
  }
})

export default router
