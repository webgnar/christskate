import TempNode from '../core/TempNode.js';
import { addMethodChaining, nodeProxy } from '../tsl/TSLCore.js';

/**
 * This node represents basic mathematical and logical operations like addition,
 * subtraction or comparisons (e.g. `equal()`).
 *
 * @augments TempNode
 */
class OperatorNode extends TempNode {

	static get type() {

		return 'OperatorNode';

	}

	/**
	 * Constructs a new operator node.
	 *
	 * @param {string} op - The operator.
	 * @param {Node} aNode - The first input.
	 * @param {Node} bNode - The second input.
	 * @param {...Node} params - Additional input parameters.
	 */
	constructor( op, aNode, bNode, ...params ) {

		super();

		if ( params.length > 0 ) {

			let finalOp = new OperatorNode( op, aNode, bNode );

			for ( let i = 0; i < params.length - 1; i ++ ) {

				finalOp = new OperatorNode( op, finalOp, params[ i ] );

			}

			aNode = finalOp;
			bNode = params[ params.length - 1 ];

		}

		/**
		 * The operator.
		 *
		 * @type {string}
		 */
		this.op = op;

		/**
		 * The first input.
		 *
		 * @type {Node}
		 */
		this.aNode = aNode;

		/**
		 * The second input.
		 *
		 * @type {Node}
		 */
		this.bNode = bNode;

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		this.isOperatorNode = true;

	}

	/**
	 * This method is overwritten since the node type is inferred from the operator
	 * and the input node types.
	 *
	 * @param {NodeBuilder} builder - The current node builder.
	 * @param {string} output - The current output string.
	 * @return {string} The node type.
	 */
	getNodeType( builder, output ) {

		const op = this.op;

		const aNode = this.aNode;
		const bNode = this.bNode;

		const typeA = aNode.getNodeType( builder );
		const typeB = typeof bNode !== 'undefined' ? bNode.getNodeType( builder ) : null;

		if ( typeA === 'void' || typeB === 'void' ) {

			return 'void';

		} else if ( op === '%' ) {

			return typeA;

		} else if ( op === '~' || op === '&' || op === '|' || op === '^' || op === '>>' || op === '<<' ) {

			return builder.getIntegerType( typeA );

		} else if ( op === '!' || op === '==' || op === '!=' || op === '&&' || op === '||' || op === '^^' ) {

			return 'bool';

		} else if ( op === '<' || op === '>' || op === '<=' || op === '>=' ) {

			const typeLength = output ? builder.getTypeLength( output ) : Math.max( builder.getTypeLength( typeA ), builder.getTypeLength( typeB ) );

			return typeLength > 1 ? `bvec${ typeLength }` : 'bool';

		} else {

			// Handle matrix operations
			if ( builder.isMatrix( typeA ) ) {

				if ( typeB === 'float' ) {

					return typeA; // matrix * scalar = matrix

				} else if ( builder.isVector( typeB ) ) {

					return builder.getVectorFromMatrix( typeA ); // matrix * vector

				} else if ( builder.isMatrix( typeB ) ) {

					return typeA; // matrix * matrix

				}

			} else if ( builder.isMatrix( typeB ) ) {

				if ( typeA === 'float' ) {

					return typeB; // scalar * matrix = matrix

				} else if ( builder.isVector( typeA ) ) {

					return builder.getVectorFromMatrix( typeB ); // vector * matrix

				}

			}

			// Handle non-matrix cases
			if ( builder.getTypeLength( typeB ) > builder.getTypeLength( typeA ) ) {

				// anytype x anytype: use the greater length vector

				return typeB;

			}

			return typeA;

		}

	}

	generate( builder, output ) {

		const op = this.op;

		const aNode = this.aNode;
		const bNode = this.bNode;

		const type = this.getNodeType( builder, output );

		let typeA = null;
		let typeB = null;

		if ( type !== 'void' ) {

			typeA = aNode.getNodeType( builder );
			typeB = typeof bNode !== 'undefined' ? bNode.getNodeType( builder ) : null;

			if ( op === '<' || op === '>' || op === '<=' || op === '>=' || op === '==' || op === '!=' ) {

				if ( builder.isVector( typeA ) ) {

					typeB = typeA;

				} else if ( typeA !== typeB ) {

					typeA = typeB = 'float';

				}

			} else if ( op === '>>' || op === '<<' ) {

				typeA = type;
				typeB = builder.changeComponentType( typeB, 'uint' );

			} else if ( builder.isMatrix( typeA ) ) {

				if ( typeB === 'float' ) {

					// Keep matrix type for typeA, but ensure typeB stays float
					typeB = 'float';

				} else if ( builder.isVector( typeB ) ) {

					// matrix x vector
					typeB = builder.getVectorFromMatrix( typeA );

				} else if ( builder.isMatrix( typeB ) ) {
					// matrix x matrix - keep both types
				} else {

					typeA = typeB = type;

				}

			} else if ( builder.isMatrix( typeB ) ) {

				if ( typeA === 'float' ) {

					// Keep matrix type for typeB, but ensure typeA stays float
					typeA = 'float';

				} else if ( builder.isVector( typeA ) ) {

					// vector x matrix
					typeA = builder.getVectorFromMatrix( typeB );

				} else {

					typeA = typeB = type;

				}

			} else {

				// anytype x anytype

				typeA = typeB = type;

			}

		} else {

			typeA = typeB = type;

		}

		const a = aNode.build( builder, typeA );
		const b = typeof bNode !== 'undefined' ? bNode.build( builder, typeB ) : null;

		const outputLength = builder.getTypeLength( output );
		const fnOpSnippet = builder.getFunctionOperator( op );

		if ( output !== 'void' ) {

			if ( op === '<' && outputLength > 1 ) {

				if ( builder.useComparisonMethod ) {

					return builder.format( `${ builder.getMethod( 'lessThan', output ) }( ${ a }, ${ b } )`, type, output );

				} else {

					return builder.format( `( ${ a } < ${ b } )`, type, output );

				}

			} else if ( op === '<=' && outputLength > 1 ) {

				if ( builder.useComparisonMethod ) {

					return builder.format( `${ builder.getMethod( 'lessThanEqual', output ) }( ${ a }, ${ b } )`, type, output );

				} else {

					return builder.format( `( ${ a } <= ${ b } )`, type, output );

				}

			} else if ( op === '>' && outputLength > 1 ) {

				if ( builder.useComparisonMethod ) {

					return builder.format( `${ builder.getMethod( 'greaterThan', output ) }( ${ a }, ${ b } )`, type, output );

				} else {

					return builder.format( `( ${ a } > ${ b } )`, type, output );

				}

			} else if ( op === '>=' && outputLength > 1 ) {

				if ( builder.useComparisonMethod ) {

					return builder.format( `${ builder.getMethod( 'greaterThanEqual', output ) }( ${ a }, ${ b } )`, type, output );

				} else {

					return builder.format( `( ${ a } >= ${ b } )`, type, output );

				}

			} else if ( op === '!' || op === '~' ) {

				return builder.format( `(${op}${a})`, typeA, output );

			} else if ( fnOpSnippet ) {

				return builder.format( `${ fnOpSnippet }( ${ a }, ${ b } )`, type, output );

			} else {

				// Handle matrix operations
				if ( builder.isMatrix( typeA ) && typeB === 'float' ) {

					return builder.format( `( ${ b } ${ op } ${ a } )`, type, output );

				} else if ( typeA === 'float' && builder.isMatrix( typeB ) ) {

					return builder.format( `${ a } ${ op } ${ b }`, type, output );

				} else {

					return builder.format( `( ${ a } ${ op } ${ b } )`, type, output );

				}

			}

		} else if ( typeA !== 'void' ) {

			if ( fnOpSnippet ) {

				return builder.format( `${ fnOpSnippet }( ${ a }, ${ b } )`, type, output );

			} else {

				if ( builder.isMatrix( typeA ) && typeB === 'float' ) {

					return builder.format( `${ b } ${ op } ${ a }`, type, output );

				} else {

					return builder.format( `${ a } ${ op } ${ b }`, type, output );

				}

			}

		}

	}

	serialize( data ) {

		super.serialize( data );

		data.op = this.op;

	}

	deserialize( data ) {

		super.deserialize( data );

		this.op = data.op;

	}

}

export default OperatorNode;

/**
 * Returns the addition of two or more value.
 *
 * @tsl
 * @function
 * @param {Node} aNode - The first input.
 * @param {Node} bNode - The second input.
 * @param {...Node} params - Additional input parameters.
 * @returns {OperatorNode}
 */
export const add = /*@__PURE__*/ nodeProxy( OperatorNode, '+' );

/**
 * Returns the subtraction of two or more value.
 *
 * @tsl
 * @function
 * @param {Node} aNode - The first input.
 * @param {Node} bNode - The second input.
 * @param {...Node} params - Additional input parameters.
 * @returns {OperatorNode}
 */
export const sub = /*@__PURE__*/ nodeProxy( OperatorNode, '-' );

/**
 * Returns the multiplication of two or more value.
 *
 * @tsl
 * @function
 * @param {Node} aNode - The first input.
 * @param {Node} bNode - The second input.
 * @param {...Node} params - Additional input parameters.
 * @returns {OperatorNode}
 */
export const mul = /*@__PURE__*/ nodeProxy( OperatorNode, '*' );

/**
 * Returns the division of two or more value.
 *
 * @tsl
 * @function
 * @param {Node} aNode - The first input.
 * @param {Node} bNode - The second input.
 * @param {...Node} params - Additional input parameters.
 * @returns {OperatorNode}
 */
export const div = /*@__PURE__*/ nodeProxy( OperatorNode, '/' );

/**
 * Computes the remainder of dividing the first node by the second, for integer values.
 *
 * @tsl
 * @function
 * @param {Node} aNode - The first input.
 * @param {Node} bNode - The second input.
 * @returns {OperatorNode}
 */
export const modInt = /*@__PURE__*/ nodeProxy( OperatorNode, '%' );

/**
 * Checks if two nodes are equal.
 *
 * @tsl
 * @function
 * @param {Node} aNode - The first input.
 * @param {Node} bNode - The second input.
 * @returns {OperatorNode}
 */
export const equal = /*@__PURE__*/ nodeProxy( OperatorNode, '==' );

/**
 * Checks if two nodes are not equal.
 *
 * @tsl
 * @function
 * @param {Node} aNode - The first input.
 * @param {Node} bNode - The second input.
 * @returns {OperatorNode}
 */
export const notEqual = /*@__PURE__*/ nodeProxy( OperatorNode, '!=' );

/**
 * Checks if the first node is less than the second.
 *
 * @tsl
 * @function
 * @param {Node} aNode - The first input.
 * @param {Node} bNode - The second input.
 * @returns {OperatorNode}
 */
export const lessThan = /*@__PURE__*/ nodeProxy( OperatorNode, '<' );

/**
 * Checks if the first node is greater than the second.
 *
 * @tsl
 * @function
 * @param {Node} aNode - The first input.
 * @param {Node} bNode - The second input.
 * @returns {OperatorNode}
 */
export const greaterThan = /*@__PURE__*/ nodeProxy( OperatorNode, '>' );

/**
 * Checks if the first node is less than or equal to the second.
 *
 * @tsl
 * @function
 * @param {Node} aNode - The first input.
 * @param {Node} bNode - The second input.
 * @returns {OperatorNode}
 */
export const lessThanEqual = /*@__PURE__*/ nodeProxy( OperatorNode, '<=' );

/**
 * Checks if the first node is greater than or equal to the second.
 *
 * @tsl
 * @function
 * @param {Node} aNode - The first input.
 * @param {Node} bNode - The second input.
 * @returns {OperatorNode}
 */
export const greaterThanEqual = /*@__PURE__*/ nodeProxy( OperatorNode, '>=' );

/**
 * Performs logical AND on two nodes.
 *
 * @tsl
 * @function
 * @param {Node} aNode - The first input.
 * @param {Node} bNode - The second input.
 * @returns {OperatorNode}
 */
export const and = /*@__PURE__*/ nodeProxy( OperatorNode, '&&' );

/**
 * Performs logical OR on two nodes.
 *
 * @tsl
 * @function
 * @param {Node} aNode - The first input.
 * @param {Node} bNode - The second input.
 * @returns {OperatorNode}
 */
export const or = /*@__PURE__*/ nodeProxy( OperatorNode, '||' );

/**
 * Performs logical NOT on a node.
 *
 * @tsl
 * @function
 * @param {Node} aNode - The first input.
 * @param {Node} bNode - The second input.
 * @returns {OperatorNode}
 */
export const not = /*@__PURE__*/ nodeProxy( OperatorNode, '!' );

/**
 * Performs logical XOR on two nodes.
 *
 * @tsl
 * @function
 * @param {Node} aNode - The first input.
 * @param {Node} bNode - The second input.
 * @returns {OperatorNode}
 */
export const xor = /*@__PURE__*/ nodeProxy( OperatorNode, '^^' );

/**
 * Performs bitwise AND on two nodes.
 *
 * @tsl
 * @function
 * @param {Node} aNode - The first input.
 * @param {Node} bNode - The second input.
 * @returns {OperatorNode}
 */
export const bitAnd = /*@__PURE__*/ nodeProxy( OperatorNode, '&' );

/**
 * Performs bitwise NOT on a node.
 *
 * @tsl
 * @function
 * @param {Node} aNode - The first input.
 * @param {Node} bNode - The second input.
 * @returns {OperatorNode}
 */
export const bitNot = /*@__PURE__*/ nodeProxy( OperatorNode, '~' );

/**
 * Performs bitwise OR on two nodes.
 *
 * @tsl
 * @function
 * @param {Node} aNode - The first input.
 * @param {Node} bNode - The second input.
 * @returns {OperatorNode}
 */
export const bitOr = /*@__PURE__*/ nodeProxy( OperatorNode, '|' );

/**
 * Performs bitwise XOR on two nodes.
 *
 * @tsl
 * @function
 * @param {Node} aNode - The first input.
 * @param {Node} bNode - The second input.
 * @returns {OperatorNode}
 */
export const bitXor = /*@__PURE__*/ nodeProxy( OperatorNode, '^' );

/**
 * Shifts a node to the left.
 *
 * @tsl
 * @function
 * @param {Node} aNode - The node to shift.
 * @param {Node} bNode - The value to shift.
 * @returns {OperatorNode}
 */
export const shiftLeft = /*@__PURE__*/ nodeProxy( OperatorNode, '<<' );

/**
 * Shifts a node to the right.
 *
 * @tsl
 * @function
 * @param {Node} aNode - The node to shift.
 * @param {Node} bNode - The value to shift.
 * @returns {OperatorNode}
 */
export const shiftRight = /*@__PURE__*/ nodeProxy( OperatorNode, '>>' );

addMethodChaining( 'add', add );
addMethodChaining( 'sub', sub );
addMethodChaining( 'mul', mul );
addMethodChaining( 'div', div );
addMethodChaining( 'modInt', modInt );
addMethodChaining( 'equal', equal );
addMethodChaining( 'notEqual', notEqual );
addMethodChaining( 'lessThan', lessThan );
addMethodChaining( 'greaterThan', greaterThan );
addMethodChaining( 'lessThanEqual', lessThanEqual );
addMethodChaining( 'greaterThanEqual', greaterThanEqual );
addMethodChaining( 'and', and );
addMethodChaining( 'or', or );
addMethodChaining( 'not', not );
addMethodChaining( 'xor', xor );
addMethodChaining( 'bitAnd', bitAnd );
addMethodChaining( 'bitNot', bitNot );
addMethodChaining( 'bitOr', bitOr );
addMethodChaining( 'bitXor', bitXor );
addMethodChaining( 'shiftLeft', shiftLeft );
addMethodChaining( 'shiftRight', shiftRight );

/**
 * @tsl
 * @function
 * @deprecated since r168. Use {@link modInt} instead.
 *
 * @param  {...any} params
 * @returns {Function}
 */
export const remainder = ( ...params ) => { // @deprecated, r168

	console.warn( 'TSL.OperatorNode: .remainder() has been renamed to .modInt().' );
	return modInt( ...params );

};

addMethodChaining( 'remainder', remainder );
