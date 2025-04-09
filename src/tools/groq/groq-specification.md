# GROQ Specification Guide

<section id="overview">
## GROQ: Graph-Relational Object Queries

GROQ is a powerful query language designed for JSON-like data structures. It allows you to:

- Filter and join data from multiple collections without explicit joins
- Shape your results exactly as needed
- Work with references between documents naturally
- Perform aggregation and grouping operations
- Order and slice result sets efficiently
</section>

<section id="core-structure">
## Core Query Structure

### Dataset Selection

Start your query by selecting what to search:

```groq
*[_type == 'post']
```

The `*` selects the current dataset (all documents), then filters to only posts.

### Filtering

Use conditions in square brackets to filter documents:

```groq
*[_type == 'post' && publishedAt > '2023-01-01']
```

This gets all posts published after January 1, 2023.

### Projection

Shape your results using projection objects:

```groq
*[_type == 'post']{
  title,
  body,
  author
}
```

This returns only the title, body, and author fields from each post.

### Following References

Use the arrow operator (`->`) to follow references to other documents:

```groq
*[_type == 'post']{
  title,
  'authorName': author->name
}
```

This gets posts with their authors' names.

### Ordering Results

Sort your results with the order function:

```groq
*[_type == 'post'] | order(publishedAt desc)
```

This gets posts sorted by publish date (newest first).

### Limiting Results

Use slicing to limit the number of results:

```groq
*[_type == 'post'] | order(publishedAt desc)[0...10]
```

This gets the 10 most recent posts.

</section>

<section id="operators">
## Operators

| Operator | Description                     | Example                                   |
| -------- | ------------------------------- | ----------------------------------------- |
| `==`     | Equal to                        | `_type == 'post'`                         |
| `!=`     | Not equal to                    | `_type != 'page'`                         |
| `>`      | Greater than                    | `publishedAt > '2023-01-01'`              |
| `>=`     | Greater than or equal to        | `views >= 100`                            |
| `<`      | Less than                       | `price < 50`                              |
| `<=`     | Less than or equal to           | `stock <= 10`                             |
| `in`     | Check if value exists in array  | `'fiction' in categories`                 |
| `match`  | Check if string matches pattern | `title match 'coffee*'`                   |
| `&&`     | Logical AND                     | `_type == 'post' && published == true`    |
| `\|\|`   | Logical OR                      | `_type == 'post' \|\| _type == 'article'` |
| `!`      | Logical NOT                     | `!draft`                                  |
| `?`      | Conditional (ternary)           | `featured ? title : null`                 |

</section>

<section id="functions">
## Useful Functions

- **count()**: Count items in an array

  ```groq
  count(*[_type == 'post'])
  ```

- **defined()**: Check if a property exists

  ```groq
  *[_type == 'post' && defined(imageUrl)]
  ```

- **references()**: Check if a document references another

  ```groq
  *[_type == 'post' && references('author-id')]
  ```

- **order()**: Sort results by a property
  ```groq
  *[_type == 'post'] | order(publishedAt desc)
  ```
  </section>

<section id="examples">
## Common Query Examples

1. **Get all posts**

   ```groq
   *[_type == 'post']
   ```

2. **Get just the titles of all posts**

   ```groq
   *[_type == 'post'].title
   ```

3. **Get posts with their author names**

   ```groq
   *[_type == 'post']{
     title,
     'authorName': author->name
   }
   ```

4. **Get the 10 most recent posts**
   ```groq
   *[_type == 'post'] | order(publishedAt desc)[0...10]
   ```
   </section>

<section id="resources">
## Learning Resources

- [GROQ Documentation](https://www.sanity.io/docs/groq)
- [GROQ Cheat Sheet](https://www.sanity.io/docs/query-cheat-sheet)
- [Learn GROQ Interactive](https://groq.dev/)
- [GROQ Specification](https://sanity-io.github.io/GROQ/)
</section>
