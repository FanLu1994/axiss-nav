"use client"

import { useState, ChangeEvent, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { LinkCard } from "@/components/ui/link-card"
import { RandomTags } from "@/components/ui/random-tags"
import { Particles } from "@/components/ui/particles"
import { Toaster } from "@/components/ui/sonner"
import { useRouter } from "next/navigation"

export default function Home() {
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [links, setLinks] = useState<any[]>([])
  const [form, setForm] = useState({ title: "", url: "", description: "", tags: "" })
  const [tagSeed, setTagSeed] = useState(0)
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  // 检查用户登录状态
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      // 验证token有效性
      fetchUserInfo(token)
    }
  }, [])

  const fetchUserInfo = async (token: string) => {
    try {
      const res = await fetch("/api/auth/me", {
        headers: { "authorization": `Bearer ${token}` }
      })
      if (res.ok) {
        const userData = await res.json()
        setUser(userData)
      } else {
        localStorage.removeItem('token')
        setUser(null)
      }
    } catch (error) {
      localStorage.removeItem('token')
      setUser(null)
    }
  }

  // 加载数据 - 不需要登录也可以查看
  const fetchLinks = async () => {
    setLoading(true)
    const token = localStorage.getItem('token')
    const headers: Record<string, string> = {}
    if (token) {
      headers.authorization = `Bearer ${token}`
    }
    
    const res = await fetch("/api/links", { headers })
    const data = await res.json()
    if (Array.isArray(data)) {
      setLinks(data)
    } else {
      setLinks([])
      if (data.error) {
        console.error(data.error)
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchLinks()
  }, [])

  const filteredLinks = links.filter(link =>
    link.title.includes(search) || 
    link.url.includes(search) || 
    (link.description?.includes(search)) || 
    (link.tags && Array.isArray(link.tags) && link.tags.some((tag: any) => 
      typeof tag === 'string' ? tag.includes(search) : tag.name?.includes(search)
    ))
  )

  // 添加新链接
  const handleAdd = async () => {
    if (!user) {
      setOpen(false)
      return
    }
    
    if (!form.title || !form.url) {
      alert("标题和网址不能为空")
      return
    }
    
    const token = localStorage.getItem('token')
    const tags = form.tags ? form.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : []
    
    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          title: form.title,
          url: form.url,
          description: form.description,
          tags
        })
      })
      
      if (res.ok) {
        alert("添加成功")
        setForm({ title: "", url: "", description: "", tags: "" })
        setOpen(false)
        fetchLinks()
      } else {
        const data = await res.json()
        alert(data.error || "添加失败")
      }
    } catch (error) {
      alert("添加失败，请稍后重试")
    }
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
  }

  const handleTagClick = (tag: string) => {
    setSearch(tag)
  }

  const handleRefreshTags = () => {
    setTagSeed(prev => prev + 1)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setUser(null)
    setLinks([])
    alert("已退出登录")
  }

  const handleLogin = () => {
    router.push("/login")
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center px-4 py-12 relative">
      <Particles />
      
      {/* 右上角登录状态 */}
      <div className="absolute top-4 right-4 z-20">
        {user ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">欢迎，{user.username}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              className="bg-white/80 backdrop-blur-sm"
            >
              退出
            </Button>
          </div>
        ) : (
          <Button 
            onClick={handleLogin}
            className="bg-gray-800 hover:bg-gray-900 text-white shadow-md"
          >
            登录
          </Button>
        )}
      </div>

      <div className="w-full max-w-2xl flex flex-col items-center mb-8 relative z-10">
        {/* 随机标签 */}
        <RandomTags
          links={links}
          onTagClick={handleTagClick}
          onRefresh={handleRefreshTags}
          tagSeed={tagSeed}
        />
        
        <div className="flex w-full max-w-md gap-3 mb-8">
          <Input
            placeholder="搜索网址..."
            value={search}
            onChange={handleInputChange}
            className="flex-1 bg-white shadow-sm rounded-full px-5 py-2 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          {user && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="rounded-full px-6 text-base font-semibold shadow-md" 
                  size="lg"
                >
                  +
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm w-full">
                <DialogHeader>
                  <DialogTitle>添加网址</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <Input
                    placeholder="标题"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  />
                  <Input
                    placeholder="网址（https://...）"
                    value={form.url}
                    onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                  />
                  <Input
                    placeholder="描述（可选）"
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  />
                  <Input
                    placeholder="标签（用逗号分隔，如：搜索,工具）"
                    value={form.tags}
                    onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                  />
                  <Button className="w-full mt-2" onClick={handleAdd} size="lg">保存</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
      <div className="w-full max-w-6xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 relative z-10">
        {filteredLinks.length === 0 ? (
          <div className="col-span-full text-center text-gray-400 py-20 text-lg bg-white/80 backdrop-blur-sm rounded-xl shadow-sm">
            暂无收藏网址
          </div>
        ) : (
          filteredLinks.map(link => (
            <LinkCard
              key={link.id}
              {...link}
              onTagClick={handleTagClick}
            />
          ))
        )}
      </div>
      <Toaster />
    </main>
  )
}