---
title: Fonts
---
import SpreadSheet from "@rowsncolumns/spreadsheet";

SpreadSheet grid supports webfonts from Google, Typekit, Fonts.com and FontDeck using [WebfontLoader](https://github.com/typekit/webfontloader)

### `fontList?: string[]`

Accepts an array of font family names that will be displayed in the toolbar

#### Demo

```jsx
const sheets = [
  {
    name: 'Sheet 1',
    id: 0,
    cells: {
      1: {
        1: {
          text: 'Hello Source Sans Pro',
          fontFamily: 'Source Sans Pro'
        }
      }
    }
  }
]

<SpreadSheet
  fontList={
    [
      'Source Sans Pro',
      'Arial'
    ]
  }
/>
```

export const App = () => {
  const sheets = [
    {
      name: 'Sheet 1',
      id: 0,
      cells: {
        1: {
          1: {
            text: 'Hello Source Sans Pro',
            fontFamily: 'Source Sans Pro'
          }
        }
      }
    }
  ]
  return (
    <SpreadSheet
      autoFocus={false}
      initialSheets={sheets}
      fontLoaderConfig={{
        google: {
          families: ['Source Sans Pro']
        }
      }}
      fontList={
        [
          'Source Sans Pro',
          'Arial'
        ]
      }
    />
  )
}

<App />


## `fontLoaderConfig: WebFont.Config`

### Loading custom webfonts from Google fonts

```jsx
const sheets = [
  {
    name: 'Sheet 1',
    id: 0,
    cells: {
      1: {
        1: {
          text: 'Hello Source Sans Pro',
          fontFamily: 'Source Sans Pro'
        }
      }
    }
  }
]

<SpreadSheet
  initialSheets={sheets}
  fontLoaderConfig={{
    google: {
      families: ['Source Sans Pro']
    }
  }}
  fontList={
    [
      'Source Sans Pro'
    ]
  }
/>
```


### Loading local fonts

Use the following config to load webfonts from a css file

```jsx
fontLoaderConfig = {
  custom: {
    families: ['My Font', 'My Other Font:n4,i4,n7'],
    urls: ['/fonts.css']
  }
};
```

[More info on Font Loading](https://www.npmjs.com/package/webfontloader#custom)