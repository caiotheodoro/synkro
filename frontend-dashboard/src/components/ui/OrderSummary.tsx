import React, { useMemo } from "react";
import { Plus, Minus } from "lucide-react";

interface OrderItem {
  product_id: string;
  sku: string;
  name: string;
  quantity: number;
  unit_price: number;
}

interface OrderSummaryProps {
  items: OrderItem[];
  onUpdateQuantity?: (productId: string, newQuantity: number) => void;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  items,
  onUpdateQuantity,
}) => {
  const subtotal = useMemo(() => {
    return items.reduce(
      (sum, item) => sum + item.quantity * item.unit_price,
      0
    );
  }, [items]);

  const tax = useMemo(() => {
    return subtotal * 0.1;
  }, [subtotal]);

  const total = useMemo(() => {
    return subtotal + tax;
  }, [subtotal, tax]);

  const handleIncreaseQuantity = (
    productId: string,
    currentQuantity: number
  ) => {
    if (onUpdateQuantity) {
      onUpdateQuantity(productId, currentQuantity + 1);
    }
  };

  const handleDecreaseQuantity = (
    productId: string,
    currentQuantity: number
  ) => {
    if (onUpdateQuantity && currentQuantity > 1) {
      onUpdateQuantity(productId, currentQuantity - 1);
    }
  };

  return (
    <div className="mt-10 bg-gray-50 border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <h3 className="text-lg font-bold mb-4">Order Summary</h3>

      {items.length === 0 ? (
        <p className="text-gray-500 italic">No items added to order</p>
      ) : (
        <>
          <div className="space-y-2 mb-4">
            {items.map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-center py-2 border-b border-gray-200"
              >
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                </div>

                {onUpdateQuantity && (
                  <div className="flex items-center mx-4">
                    <button
                      onClick={() =>
                        handleDecreaseQuantity(item.product_id, item.quantity)
                      }
                      disabled={item.quantity <= 1}
                      className="w-8 h-8 flex items-center justify-center border-2 border-black bg-white disabled:opacity-50 disabled:cursor-not-allowed shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="mx-2 font-medium w-6 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        handleIncreaseQuantity(item.product_id, item.quantity)
                      }
                      className="w-8 h-8 flex items-center justify-center border-2 border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
                      aria-label="Increase quantity"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                )}

                <div className="text-right">
                  <p className="font-medium">
                    ${(item.quantity * item.unit_price).toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500">
                    ${item.unit_price.toFixed(2)} each
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (10%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-300">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
