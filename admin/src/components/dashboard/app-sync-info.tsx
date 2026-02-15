import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Info } from 'lucide-react'

export function AppSyncInfo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Info className="h-4 w-4 text-blue-500" />
          App Sync
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Changes saved here appear in the mobile app within 15–30 minutes.
          To force an immediate refresh, open the section in GoodBarber and click Save.
        </p>
        <a
          href="https://m.theblockislandapp.com/manage/app/content/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Open GoodBarber Admin &rarr;
        </a>
      </CardContent>
    </Card>
  )
}
