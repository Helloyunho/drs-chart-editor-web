import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSub,
  MenubarSubTrigger,
  MenubarSubContent
} from '@/components/ui/menubar'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import React from 'react'
import { useAtom } from 'jotai/react'
import { speedAtom } from '@/stores/speed.atom'
import { Button } from '@/components/ui/button'
import { themeAtom, type Theme } from '@/stores/theme.atom'

const toDecimalString = (value: number): string => {
  if (Number.isInteger(value)) {
    return value.toString() + '.0'
  } else {
    return value.toString()
  }
}

export const MenuBar = () => {
  const [speed, setSpeed] = useAtom(speedAtom)
  const [theme, setTheme] = useAtom(themeAtom)
  const [speedText, setSpeedText] = React.useState(toDecimalString(speed))
  const [openSpeedDialog, setOpenSpeedDialog] = React.useState(false)

  const handleSpeedChange = () => {
    const parsedSpeed = parseFloat(speedText)
    if (!isNaN(parsedSpeed) && parsedSpeed > 0) {
      setSpeed(parsedSpeed)
      setSpeedText(toDecimalString(parsedSpeed))
      setOpenSpeedDialog(false)
    } else {
      setSpeed(4)
      setSpeedText('4.0')
      setOpenSpeedDialog(false)
    }
  }

  return (
    <div className='fixed top-0 left-0 w-full z-50'>
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>View</MenubarTrigger>
          <MenubarContent>
            <MenubarItem onClick={() => setOpenSpeedDialog(true)}>
              Speed <span className='ml-auto'>{toDecimalString(speed)}x</span>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarSub>
              <MenubarSubTrigger>Theme <span className='ml-auto'>{theme}</span></MenubarSubTrigger>
              <MenubarSubContent>
                <MenubarRadioGroup value={theme} onValueChange={(value) => setTheme(value as Theme)}>
                  <MenubarRadioItem value='light'>Light</MenubarRadioItem>
                  <MenubarRadioItem value='dark'>Dark</MenubarRadioItem>
                  <MenubarRadioItem value='system'>System</MenubarRadioItem>
                </MenubarRadioGroup>
              </MenubarSubContent>
            </MenubarSub>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
      <Dialog open={openSpeedDialog} onOpenChange={setOpenSpeedDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Speed</DialogTitle>
            <DialogDescription>
              Adjust the track playback speed.
            </DialogDescription>
          </DialogHeader>
          <Label htmlFor='speed'>Speed</Label>
          <Input
            placeholder='4.0'
            onChange={(e) => {
              const value = e.target.value
              setSpeedText(value)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSpeedChange()
              }
            }}
            value={speedText}
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant='outline'>Close</Button>
            </DialogClose>
            <Button onClick={() => handleSpeedChange()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
