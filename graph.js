const dimension = { height: 300, width: 300, radius: 150 }
const center = { x: (dimension.width / 2 + 5), y: (dimension.height / 2 + 5)}

const svg = d3.select('.canvas')
  .append('svg')
  .attr('width', dimension.width + 150)
  .attr('height', dimension.height + 150)

const graph = svg.append('g')
  .attr('transform', `translate(${center.x}, ${center.y})`)

const pie = d3.pie()
  .sort(null) // tell d3.pie to not resort the data
  .value(d => d.cost)

const arcPath = d3.arc()
  .outerRadius(dimension.radius)
  .innerRadius(dimension.radius / 2)

// color scale
const color = d3.scaleOrdinal(d3['schemeSet3'])
 
// legend setup
const legendGroud = svg.append('g')
  .attr('transform', `translate(${dimension.width + 40}, 10)`)

const legend = d3.legendColor()
  .shape('circle')
  .shapePadding(10)
  .scale(color)

const tooltip = d3.tip()
  .attr('class', 'tip card') // `card` is the materialize CSS class
  .html( d => {
    let content = `<div class="name">${d.data.name}</div>`
    content += `<div class="cost">${d.data.cost}</div>`
    content += `<div class="delete">Click slice to delete</div>`
    return content
  })

graph.call(tooltip)

// update function and deal with graph
const update = (data) => {

  // update color scale domain
  color.domain(data.map( d => d.name ))

  // update and call legend
  legendGroud.call(legend)
  legendGroud.selectAll('text')
    .attr('fill', 'white')
  

  // join enhanced (pie) data to path elements
  const paths = graph.selectAll('path')
    .data( pie(data) )

  // handle the exit selection
  paths.exit()
    .transition().duration(750)
    .attrTween('d', arcTweenExit)
    .remove()


  // handle the current DOM path updates
  paths.attr('d', arcPath) // pass new data
    .transition().duration(750)
    .attrTween('d', arcTweenUpdate)

  // append the enter selection to the DOM
  paths.enter()
    .append('path')
      .attr('class', 'arc')
      .attr('stroke', '#fff')
      .attr('stroke-width', 3)
      .attr('fill', d => color(d.data.name))
      .each( function(d) { this._current = d }) // allow to perform a function on each one of these
      .transition().duration(750)
        .attrTween('d', arcTweenEnter)

  // add events
  graph.selectAll('path')
  // automatically pass `i` index of that element, 'n' the element in array in that selection 
    .on('mouseover', handleMouseOver) 
    .on('mouseout', handleMouseOut)
    .on('click', handleClick)  

}

// data array and firestore
var data = []
// realtime listener DB
db.collection('expenses').onSnapshot( res => {
  res.docChanges().forEach( change => {
    const doc = {...change.doc.data(), id: change.doc.id}

    switch (change.type) {
      case "added":
        data.push(doc)
        break

      case "modified":
        const idx = data.findIndex( item => item.id == doc.id)
        data[idx] = doc
        break
      
      case "removed":
        data = data.filter( item => item.id != doc.id)
        break

      default:
        break
    }
  })

  update(data)

})

const arcTweenEnter = (d) => {
  var i = d3.interpolate(d.endAngle, d.startAngle)

  // return a function which takes in a time ticker `t`
  return function(t){
    d.startAngle = i(t)
    
    return arcPath(d)
  }
}

const arcTweenExit = (d) => {
  var i = d3.interpolate(d.startAngle, d.endAngle)

  // return a function which takes in a time ticker `t`
  return function(t){
    d.startAngle = i(t)
    
    return arcPath(d)
  }
}

// use function keyword to allow use of 'this'
function arcTweenUpdate(d) {
  // interpolate between the two objects
  var i = d3.interpolate(this._current, d)
  // update the current prop with new updated data
  this._current = d

  return function(t) {
    return arcPath( i(t) )
  }
}

// event handler functions
const handleMouseOver = (d, idx, n) => {
  tooltip.show(d, n[idx])
  d3.select( n[idx] )
    .transition('changeSliceFill').duration(300)
      .attr('fill', '#fff') //change to white when hover
      .style('cursor', 'pointer')
}

const handleMouseOut = (d, idx, n) => {
  tooltip.hide(d, n[idx])
  d3.select( n[idx] )
    .transition('changeSliceFill').duration(300)
      .attr('fill', color(d.data.name)) // update color back to its original color by data's name
      .style('cursor', 'default')
}

const handleClick = (d) => {
  const id = d.data.id
  db.collection('expenses').doc(id)
    .delete()
}

